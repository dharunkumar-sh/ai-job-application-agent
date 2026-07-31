import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { updateUserSubscriptionFromStripe } from "@/lib/subscriptions";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error("Stripe Webhook signature error:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName as "Pro" | "Unlimited";

        if (userId && planName) {
          await updateUserSubscriptionFromStripe(supabase, {
            userId,
            planName,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: "active",
            paymentStatus: "paid",
            currentPeriodStart: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const planName = (subscription.metadata?.planName || "Pro") as "Pro" | "Unlimited";

        if (userId) {
          await updateUserSubscriptionFromStripe(supabase, {
            userId,
            planName,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id as string,
            status: subscription.status,
            paymentStatus: subscription.status === "active" ? "paid" : "unpaid",
            currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await updateUserSubscriptionFromStripe(supabase, {
            userId,
            planName: "Pro", // Will revert to Free via status update
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id as string,
            status: "canceled",
            paymentStatus: "unpaid",
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing Stripe webhook event:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
