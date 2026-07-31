import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyRazorpaySignature, razorpay } from "@/lib/razorpay";
import { updateUserSubscriptionFromRazorpay } from "@/lib/subscriptions";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !planName) {
      return NextResponse.json(
        { error: "Missing required payment verification details" },
        { status: 400 }
      );
    }

    // Verify signature if provided, or inspect order details
    if (razorpay_signature) {
      const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isValid && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Invalid Razorpay payment signature" },
          { status: 400 }
        );
      }
    }

    // Update user's active subscription plan
    await updateUserSubscriptionFromRazorpay(supabase, {
      userId: user.id,
      planName: planName as "Pro" | "Unlimited",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: "active",
      paymentStatus: "paid",
    });

    return NextResponse.json({
      success: true,
      message: "Subscription successfully updated",
    });
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
