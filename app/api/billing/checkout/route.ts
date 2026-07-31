import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/razorpay";

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

    const amount = priceAmount || (planName === "Pro" ? 1499 : 3999);

    const order = await createRazorpayOrder({
      userId: user.id,
      userEmail: user.email || "",
      planName: planName as "Pro" | "Unlimited",
      priceAmount: amount,
      currency: "INR",
    });

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      "rzp_test_TAoMNbdM4a6bzd";

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      planName,
      userEmail: user.email || "",
      userName: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    });
  } catch (error: any) {
    console.error("Razorpay checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate Razorpay order" },
      { status: 500 }
    );
  }
}
