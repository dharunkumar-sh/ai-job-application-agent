import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription, checkDailyApplyLimit } from "@/lib/subscriptions";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(supabase, user.id);
    const limitStatus = await checkDailyApplyLimit(supabase, user.id);

    return NextResponse.json({
      success: true,
      subscription,
      limitStatus,
    });
  } catch (error: any) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
