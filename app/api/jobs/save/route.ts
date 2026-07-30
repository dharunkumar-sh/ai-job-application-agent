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

    const { jobId, job, savedStatus, appliedStatus } = await request.json();

    const targetJobId = jobId || job?.id;

    if (!targetJobId && !job) {
      return NextResponse.json({ error: "Missing jobId or job object" }, { status: 400 });
    }

    // Check if job exists in `jobs` table for this user
    let existingJobId: string | null = null;
    if (targetJobId) {
      const { data: existing } = await supabase
        .from("jobs")
        .select("id")
        .eq("id", targetJobId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        existingJobId = existing.id;
      }
    }

    if (existingJobId) {
      const updateFields: Record<string, any> = {};
      if (typeof savedStatus === "boolean") {
        updateFields.saved_status = savedStatus;
      }
      if (typeof appliedStatus === "boolean") {
        updateFields.applied_status = appliedStatus;
      }

      const { data, error } = await supabase
        .from("jobs")
        .update(updateFields)
        .eq("id", existingJobId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, job: data });
    } else if (job) {
      // Upsert full job payload into Supabase jobs table
      const dbRow: Record<string, any> = {
        id: job.id,
        user_id: user.id,
        platform: job.platform,
        title: job.title,
        company: job.company,
        company_logo: job.company_logo || "",
        location: job.location || "",
        workplace_type: job.workplace_type || "Remote",
        salary: job.salary || "",
        job_type: job.job_type || "Full-time",
        experience_level: job.experience_level || "",
        description: job.description || "",
        tags: job.tags || [],
        match_score: job.match_score || 85,
        job_url: job.job_url,
        source_url: job.source_url || job.job_url,
        applied_status:
          typeof appliedStatus === "boolean"
            ? appliedStatus
            : Boolean(job.applied_status),
        saved_status:
          typeof savedStatus === "boolean"
            ? savedStatus
            : true,
        fetched_at: job.fetched_at || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("jobs")
        .upsert(dbRow, { onConflict: "id" })
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, job: data });
    }

    return NextResponse.json({ error: "Job record not found to update" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update job status" },
      { status: 500 }
    );
  }
}

