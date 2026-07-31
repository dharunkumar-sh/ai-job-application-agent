import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscriptions";
import { createStripePortalSession } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await getUserSubscription(supabase, user.id);
    const returnUrl = `${request.headers.get("origin") || "http://localhost:3000"}/dashboard/billing`;

    if (
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_mock") &&
      sub.stripeCustomerId
    ) {
      const portal = await createStripePortalSession(sub.stripeCustomerId, returnUrl);
      return NextResponse.json({ success: true, url: portal.url });
    }

    // Return redirect URL back to billing page with active portal notice
    return NextResponse.json({
      success: true,
      url: `${returnUrl}?portal=active`,
      message: "Manage active subscription",
    });
  } catch (error: any) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
