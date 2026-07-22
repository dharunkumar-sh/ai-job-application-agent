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

    const { data, error } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        job_id: jobId || null,
        platform: platform || "General",
        status: "Manual Apply",
        notes: notes || "Opened external application link manually",
        submitted_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    if (jobId) {
      await supabase
        .from("jobs")
        .update({ applied_status: true })
        .eq("id", jobId);
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
