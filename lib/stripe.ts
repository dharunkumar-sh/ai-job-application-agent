import Stripe from "stripe";

// Initialize Stripe client safely (with fallback mock handling if STRIPE_SECRET_KEY is not set)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock_key_for_development";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-07-29.dahlia" as any,
  typescript: true,
});

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  planName: "Pro" | "Unlimited";
  priceAmount: number; // e.g. 19 or 49
  interval?: "month" | "year";
  returnUrl: string;
}

export async function createStripeCheckoutSession({
  userId,
  userEmail,
  planName,
  priceAmount,
  interval = "month",
  returnUrl,
}: CreateCheckoutSessionParams): Promise<{ url: string | null; sessionId: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is not set in environment variables. Using dev fallback.");
  }

  const planLimit = planName === "Pro" ? 25 : -1; // -1 represents unlimited

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `JobBuddy AI ${planName} Plan`,
              description:
                planName === "Pro"
                  ? "25 AI Job Applies per day + Priority Automation"
                  : "Unlimited AI Job Applies per day + Dedicated AI Execution",
            },
            unit_amount: Math.round(priceAmount * 100), // amount in cents
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planName,
        planLimit: String(planLimit),
      },
      subscription_data: {
        metadata: {
          userId,
          planName,
          planLimit: String(planLimit),
        },
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&checkout=success`,
      cancel_url: `${returnUrl}?checkout=cancelled`,
    });

    return { url: session.url, sessionId: session.id };
  } catch (error: any) {
    console.error("Stripe checkout session creation error:", error);
    throw new Error(error.message || "Failed to create Stripe checkout session");
  }
}

export async function createStripePortalSession(
  customerId: string,
  returnUrl: string
): Promise<{ url: string }> {
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: portalSession.url };
  } catch (error: any) {
    console.error("Stripe portal session creation error:", error);
    throw new Error(error.message || "Failed to open Stripe customer portal");
  }
}
