import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mock_key_id";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "mock_key_secret_for_development";

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export interface CreateRazorpayOrderParams {
  userId: string;
  userEmail: string;
  planName: "Pro" | "Unlimited";
  priceAmount: number; // e.g. 19 or 49
  currency?: string;
}

export async function createRazorpayOrder({
  userId,
  userEmail,
  planName,
  priceAmount,
  currency = "INR",
}: CreateRazorpayOrderParams) {
  const planLimit = planName === "Pro" ? 25 : -1;

  try {
    const options = {
      amount: Math.round(priceAmount * 100), // amount in lowest currency unit (cents / paise)
      currency: currency.toUpperCase(),
      receipt: `rcpt_${userId.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId,
        userEmail,
        planName,
        planLimit: String(planLimit),
      },
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    throw new Error(error.message || "Failed to create Razorpay order");
  }
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const webhookSecret = process.env.RAZORPAY_KEY_SECRET || "mock_key_secret_for_development";
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
}

export function verifyRazorpayWebhookSignature({
  body,
  signature,
  secret,
}: {
  body: string;
  signature: string;
  secret: string;
}): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
