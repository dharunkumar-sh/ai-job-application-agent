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

    const { applicationId, clearAll } = await request.json();

    if (clearAll) {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "All application records cleared",
      });
    }

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Application record deleted",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete application record" },
      { status: 500 }
    );
  }
}
