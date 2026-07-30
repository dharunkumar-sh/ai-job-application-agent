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

async function ensureJobExists(
  supabase: any,
  userId: string,
  jobId: string | null,
  jobUrl: string,
  platform: string,
  jobObj?: any
): Promise<string | null> {
  if (!jobId) return null;

  try {
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .maybeSingle();

    if (existing?.id) {
      return existing.id;
    }

    // Insert job into jobs table so foreign key constraint on applications(job_id) is satisfied
    const dbRow = {
      id: jobId,
      user_id: userId,
      platform: platform || jobObj?.platform || "General",
      title: jobObj?.title || "Job Posting",
      company: jobObj?.company || platform || "Company",
      company_logo: jobObj?.company_logo || "",
      location: jobObj?.location || "Remote",
      workplace_type: jobObj?.workplace_type || "Remote",
      salary: jobObj?.salary || "",
      job_type: jobObj?.job_type || "Full-time",
      experience_level: jobObj?.experience_level || "",
      description: jobObj?.description || "",
      tags: jobObj?.tags || [],
      match_score: jobObj?.match_score || 85,
      job_url: jobUrl || jobObj?.job_url || "",
      source_url: jobUrl || jobObj?.source_url || "",
      applied_status: false,
      saved_status: false,
      fetched_at: new Date().toISOString(),
    };

    const { data: createdJob, error: createErr } = await supabase
      .from("jobs")
      .upsert(dbRow, { onConflict: "id" })
      .select("id")
      .single();

    if (!createErr && createdJob?.id) {
      return createdJob.id;
    }
  } catch (e) {
    console.warn("Could not ensure job exists in DB:", e);
  }

  return jobId;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      jobId: passedJobId,
      jobUrl,
      platform: passedPlatform,
      job: jobObj,
    } = await request.json();

    if (!jobUrl) {
      return NextResponse.json({ error: "Missing jobUrl" }, { status: 400 });
    }

    const platform = passedPlatform || detectPlatform(jobUrl);

    // 0. Ensure target job exists in Supabase `jobs` table so foreign key constraint on `applications.job_id` passes
    const jobId = await ensureJobExists(
      supabase,
      user.id,
      passedJobId,
      jobUrl,
      platform,
      jobObj
    );

    // 1. Check existing or create new application entry in Supabase
    let applicationId: string;
    let existingApp = null;

    if (jobId) {
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("job_id", jobId)
        .maybeSingle();

      existingApp = data;
    }

    if (existingApp?.id) {
      applicationId = existingApp.id;
      await safeApplicationsUpdate(supabase, applicationId, {
        platform,
        status: "Detecting Fields",
        updated_at: new Date().toISOString(),
      });
    } else {
      applicationId = await safeApplicationsInsert(supabase, {
        user_id: user.id,
        job_id: jobId || null,
        platform,
        status: "Detecting Fields",
      });
    }

    // 2. Start Browserbase Session
    const sessionData = await createBrowserbaseSession();

    // 3. Detect Form Fields for target platform
    const detectedFields = await detectRequiredFormFields(
      jobUrl,
      platform,
      sessionData.sessionId
    );

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
      lastName:
        (profileRow?.full_name || "").split(" ").slice(1).join(" ") || "",
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
      resumeFilename:
        resumes && resumes[0]?.filename ? resumes[0].filename : undefined,
    };

    // 5. Audit Candidate Profile against required fields
    const { isComplete, missingFields } = await auditCandidateProfileForFields(
      detectedFields,
      candidateProfile
    );

    if (!isComplete) {
      // Required profile fields are missing! Update status to 'Missing Profile Info'
      await safeApplicationsUpdate(supabase, applicationId, {
        platform,
        status: "Missing Profile Info",
        detected_fields: detectedFields,
        missing_fields: missingFields,
        browserbase_session_id: sessionData.sessionId,
        browserbase_debug_url: sessionData.debugUrl,
        notes: `Missing required candidate fields: ${missingFields.join(", ")}`,
        updated_at: new Date().toISOString(),
      });

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
    await safeApplicationsUpdate(supabase, applicationId, {
      platform,
      status: "Auto-Filling",
      detected_fields: detectedFields,
      missing_fields: [],
      browserbase_session_id: sessionData.sessionId,
      browserbase_debug_url: sessionData.debugUrl,
      updated_at: new Date().toISOString(),
    });

    const submitRes = await autoFillAndSubmitWithBrowserbase({
      sessionId: sessionData.sessionId,
      debugUrl: sessionData.debugUrl,
      jobUrl,
      platform,
      profile: candidateProfile,
    });

    // 7. Update final status to 'Submitted'
    await safeApplicationsUpdate(supabase, applicationId, {
      status: "Submitted",
      browserbase_session_id: sessionData.sessionId,
      browserbase_debug_url: sessionData.debugUrl,
      notes: submitRes.notes,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

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

async function safeApplicationsInsert(
  supabase: any,
  payload: Record<string, any>
): Promise<string> {
  // 1. Primary insert attempt
  try {
    const { data, error } = await supabase
      .from("applications")
      .insert(payload)
      .select("id")
      .single();

    if (!error && data?.id) {
      return data.id;
    }
    if (error) {
      console.warn("Primary applications insert warning:", error.message);
    }
  } catch (e: any) {
    console.warn("Primary applications insert exception:", e?.message);
  }

  // 2. Second insert attempt: retry with minimal guaranteed schema columns
  try {
    const sanitized: Record<string, any> = {
      user_id: payload.user_id,
      status: payload.status || "Pending",
    };
    if (payload.job_id) sanitized.job_id = payload.job_id;
    if (payload.platform) sanitized.platform = payload.platform;

    const { data: retryData, error: retryErr } = await supabase
      .from("applications")
      .insert(sanitized)
      .select("id")
      .single();

    if (!retryErr && retryData?.id) {
      return retryData.id;
    }
    if (retryErr) {
      console.warn("Sanitized applications insert warning:", retryErr.message);
    }
  } catch (e: any) {
    console.warn("Sanitized applications insert exception:", e?.message);
  }

  // 3. Third insert attempt: try setting job_id to null (in case foreign key constraint fails)
  try {
    const minPayload: Record<string, any> = {
      user_id: payload.user_id,
      status: payload.status || "Pending",
      notes: payload.notes || (payload.platform ? `Platform: ${payload.platform}` : undefined),
    };

    const { data: minData, error: minErr } = await supabase
      .from("applications")
      .insert(minPayload)
      .select("id")
      .single();

    if (!minErr && minData?.id) {
      return minData.id;
    }
  } catch (e: any) {
    console.warn("Minimal applications insert exception:", e?.message);
  }

  // 4. Absolute fallback (mock ID)
  return `app_${Date.now()}`;
}

async function safeApplicationsUpdate(
  supabase: any,
  applicationId: string,
  payload: Record<string, any>
): Promise<void> {
  if (!applicationId) return;

  // 1. Primary update attempt
  try {
    const { error } = await supabase
      .from("applications")
      .update(payload)
      .eq("id", applicationId);

    if (!error) {
      return;
    }
    console.warn("Primary applications update warning:", error.message);
  } catch (err: any) {
    console.warn("Primary applications update exception:", err?.message);
  }

  // 2. Retry updating basic status & notes
  try {
    const sanitized: Record<string, any> = {};
    if (payload.status) sanitized.status = payload.status;
    if (payload.notes) sanitized.notes = payload.notes;
    if (payload.updated_at) sanitized.updated_at = payload.updated_at;
    if (payload.submitted_at) sanitized.submitted_at = payload.submitted_at;

    await supabase
      .from("applications")
      .update(sanitized)
      .eq("id", applicationId);
  } catch (err: any) {
    console.warn("Sanitized applications update exception:", err?.message);
  }
}


