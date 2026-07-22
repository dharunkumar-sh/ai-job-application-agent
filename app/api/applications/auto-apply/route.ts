import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  detectPlatform,
  createBrowserbaseSession,
  detectRequiredFormFields,
  auditCandidateProfileForFields,
  CandidateProfile,
  autoFillAndSubmitWithBrowserbase,
} from "@/lib/browserbase";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, jobUrl, platform: passedPlatform } = await request.json();

    if (!jobUrl) {
      return NextResponse.json({ error: "Missing jobUrl" }, { status: 400 });
    }

    const platform = passedPlatform || detectPlatform(jobUrl);

    // 1. Check existing or create new application entry in Supabase
    let applicationId: string;
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("job_id", jobId)
      .single();

    if (existingApp) {
      applicationId = existingApp.id;
      await supabase
        .from("applications")
        .update({
          platform,
          status: "Detecting Fields",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);
    } else {
      const { data: newApp, error: insertErr } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          job_id: jobId || null,
          platform,
          status: "Detecting Fields",
        })
        .select("id")
        .single();

      if (insertErr || !newApp) {
        throw new Error(insertErr?.message || "Failed to create application record");
      }
      applicationId = newApp.id;
    }

    // 2. Start Browserbase Session
    const sessionData = await createBrowserbaseSession();

    // 3. Detect Form Fields for target platform
    const detectedFields = await detectRequiredFormFields(jobUrl, platform);

    // 4. Fetch Candidate Profile from Supabase
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: resumes } = await supabase
      .from("resumes")
      .select("file_url, filename")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const candidateProfile: CandidateProfile = {
      fullName: profileRow?.full_name || "",
      firstName: (profileRow?.full_name || "").split(" ")[0] || "",
      lastName: (profileRow?.full_name || "").split(" ").slice(1).join(" ") || "",
      email: profileRow?.email || user.email || "",
      phone: profileRow?.phone || "",
      location: profileRow?.location || "",
      headline: profileRow?.headline || "",
      summary: profileRow?.summary || "",
      skills: profileRow?.skills || [],
      linkedin: profileRow?.links?.linkedin || "",
      github: profileRow?.links?.github || "",
      portfolio: profileRow?.links?.portfolio || "",
      resumeUrl: resumes && resumes[0]?.file_url ? resumes[0].file_url : undefined,
      resumeFilename: resumes && resumes[0]?.filename ? resumes[0].filename : undefined,
    };

    // 5. Audit Candidate Profile against required fields
    const { isComplete, missingFields } = await auditCandidateProfileForFields(
      detectedFields,
      candidateProfile
    );

    if (!isComplete) {
      // Required profile fields are missing! Update status to 'Missing Profile Info'
      await supabase
        .from("applications")
        .update({
          platform,
          status: "Missing Profile Info",
          detected_fields: detectedFields,
          missing_fields: missingFields,
          browserbase_session_id: sessionData.sessionId,
          browserbase_debug_url: sessionData.debugUrl,
          notes: `Missing required candidate fields: ${missingFields.join(", ")}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      return NextResponse.json({
        success: true,
        applicationId,
        platform,
        status: "Missing Profile Info",
        detectedFields,
        missingFields,
        sessionId: sessionData.sessionId,
        debugUrl: sessionData.debugUrl,
        message: "Missing profile fields required for submission",
      });
    }

    // 6. Profile is complete! Execute Auto-Fill & Submission via Browserbase
    await supabase
      .from("applications")
      .update({
        platform,
        status: "Auto-Filling",
        detected_fields: detectedFields,
        missing_fields: [],
        browserbase_session_id: sessionData.sessionId,
        browserbase_debug_url: sessionData.debugUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    const submitRes = await autoFillAndSubmitWithBrowserbase({
      sessionId: sessionData.sessionId,
      debugUrl: sessionData.debugUrl,
      jobUrl,
      platform,
      profile: candidateProfile,
    });

    // 7. Update final status to 'Submitted'
    await supabase
      .from("applications")
      .update({
        status: "Submitted",
        browserbase_session_id: sessionData.sessionId,
        browserbase_debug_url: sessionData.debugUrl,
        notes: submitRes.notes,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (jobId) {
      await supabase
        .from("jobs")
        .update({ applied_status: true })
        .eq("id", jobId);
    }

    return NextResponse.json({
      success: true,
      applicationId,
      platform,
      status: "Submitted",
      detectedFields,
      missingFields: [],
      sessionId: sessionData.sessionId,
      debugUrl: sessionData.debugUrl,
      message: "Application submitted successfully using AI Agent",
    });
  } catch (error: any) {
    console.error("Auto apply error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto-apply" },
      { status: 500 }
    );
  }
}
