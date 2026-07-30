import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, platform, notes } = await request.json();

    let targetJobId: string | null = jobId || null;

    // Verify if jobId exists in jobs table
    if (targetJobId) {
      const { data: existingJob } = await supabase
        .from("jobs")
        .select("id")
        .eq("id", targetJobId)
        .maybeSingle();

      if (!existingJob) {
        targetJobId = null;
      }
    }

    const insertPayload: Record<string, any> = {
      user_id: user.id,
      job_id: targetJobId,
      platform: platform || "General",
      status: "Manual Apply",
      notes: notes || "Opened external application link manually",
      submitted_at: new Date().toISOString(),
    };

    let data: any = null;
    let { error } = await supabase
      .from("applications")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.warn("Retrying manual application logging with minimal payload:", error.message);
      const retryRes = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          status: "Manual Apply",
          notes: notes || `Platform: ${platform || "General"} - Opened external application link manually`,
        })
        .select("*")
        .single();

      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error("Could not persist manual application record:", error);
    }

    if (jobId) {
      try {
        await supabase
          .from("jobs")
          .update({ applied_status: true })
          .eq("id", jobId);
      } catch (e) {
        console.warn("Could not set job applied_status:", e);
      }
    }

    return NextResponse.json({ success: true, application: data });
  } catch (error: any) {
    console.error("Create application error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log application" },
      { status: 500 }
    );
  }
}

