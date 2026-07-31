import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { updateUserSubscriptionFromRazorpay } from "@/lib/subscriptions";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret && sig) {
    const isValid = verifyRazorpayWebhookSignature({
      body,
      signature: sig,
      secret: webhookSecret,
    });

    if (!isValid) {
      console.error("Razorpay Webhook signature verification failed.");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.event) {
      case "payment.captured":
      case "order.paid": {
        const entity = event.payload?.payment?.entity || event.payload?.order?.entity;
        const notes = entity?.notes || {};
        const userId = notes.userId;
        const planName = notes.planName as "Pro" | "Unlimited";

        if (userId && planName) {
          await updateUserSubscriptionFromRazorpay(supabase, {
            userId,
            planName,
            razorpayPaymentId: entity?.id,
            razorpayOrderId: entity?.order_id || entity?.id,
            status: "active",
            paymentStatus: "paid",
            currentPeriodStart: new Date().toISOString(),
          });
        }
        break;
      }

      case "subscription.charged":
      case "subscription.activated": {
        const subEntity = event.payload?.subscription?.entity;
        const notes = subEntity?.notes || {};
        const userId = notes.userId;
        const planName = (notes.planName || "Pro") as "Pro" | "Unlimited";

        if (userId) {
          await updateUserSubscriptionFromRazorpay(supabase, {
            userId,
            planName,
            razorpaySubscriptionId: subEntity?.id,
            razorpayCustomerId: subEntity?.customer_id,
            status: "active",
            paymentStatus: "paid",
          });
        }
        break;
      }

      case "subscription.cancelled": {
        const subEntity = event.payload?.subscription?.entity;
        const notes = subEntity?.notes || {};
        const userId = notes.userId;

        if (userId) {
          await updateUserSubscriptionFromRazorpay(supabase, {
            userId,
            planName: "Pro",
            razorpaySubscriptionId: subEntity?.id,
            status: "canceled",
            paymentStatus: "unpaid",
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing Razorpay webhook event:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
