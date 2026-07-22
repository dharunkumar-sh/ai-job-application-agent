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

    const { jobId, savedStatus, appliedStatus } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

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
      .eq("id", jobId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, job: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update job status" }, { status: 500 });
  }
}
