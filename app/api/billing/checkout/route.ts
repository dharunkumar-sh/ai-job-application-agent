import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStripeCheckoutSession } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planName, priceAmount, interval } = await request.json();

    if (!planName || (planName !== "Pro" && planName !== "Unlimited")) {
      return NextResponse.json(
        { error: "Invalid plan name. Must be 'Pro' or 'Unlimited'." },
        { status: 400 }
      );
    }

    const amount = priceAmount || (planName === "Pro" ? 19 : 49);
    const returnUrl = `${request.headers.get("origin") || "http://localhost:3000"}/dashboard/billing`;

    // Create Stripe Checkout session using sandbox keys from environment
    const session = await createStripeCheckoutSession({
      userId: user.id,
      userEmail: user.email || "",
      planName: planName as "Pro" | "Unlimited",
      priceAmount: amount,
      interval: interval || "month",
      returnUrl,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("Billing checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate checkout session" },
      { status: 500 }
    );
  }
}
