import { SupabaseClient } from "@supabase/supabase-js";

export interface UserSubscriptionDetails {
  id?: string;
  userId: string;
  planName: "Free" | "Pro" | "Unlimited";
  planLimit: number; // 5 for Free, 25 for Pro, -1 for Unlimited
  dailyUsageCount: number;
  remainingApplies: number | "Unlimited";
  isUnlimited: boolean;
  status: string; // "active", "canceled", "trialing", etc.
  paymentStatus: string; // "paid", "free", "unpaid"
  razorpayCustomerId?: string | null;
  razorpaySubscriptionId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  lastUsageDate: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  planName: "Free" | "Pro" | "Unlimited";
  limit: number;
  used: number;
  remaining: number | "Unlimited";
  message?: string;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSubscriptionDetails> {
  const todayStr = getTodayDateString();

  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (
      error &&
      !error.message?.includes("does not exist") &&
      !error.message?.includes("schema cache")
    ) {
      console.warn("Notice reading user_subscriptions:", error.message);
    }

    if (data) {
      let dailyUsageCount = Number(data.daily_usage_count || 0);
      const lastUsageDate = data.last_usage_date || todayStr;

      // Reset count if it's a new day
      if (lastUsageDate !== todayStr) {
        dailyUsageCount = 0;
        try {
          await supabase
            .from("user_subscriptions")
            .update({
              daily_usage_count: 0,
              last_usage_date: todayStr,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        } catch (e) {}
      }

      const planName = (data.plan_name || "Free") as "Free" | "Pro" | "Unlimited";
      let planLimit = Number(data.plan_limit);
      if (isNaN(planLimit) || planLimit === 0) {
        planLimit = planName === "Pro" ? 25 : planName === "Unlimited" ? -1 : 5;
      }

      const isUnlimited = planName === "Unlimited" || planLimit === -1;
      const remainingApplies = isUnlimited
        ? "Unlimited"
        : Math.max(0, planLimit - dailyUsageCount);

      return {
        id: data.id,
        userId,
        planName,
        planLimit,
        dailyUsageCount,
        remainingApplies,
        isUnlimited,
        status: data.status || "active",
        paymentStatus: data.payment_status || (planName === "Free" ? "free" : "paid"),
        razorpayCustomerId: data.razorpay_customer_id || null,
        razorpaySubscriptionId: data.razorpay_subscription_id || null,
        razorpayOrderId: data.razorpay_order_id || null,
        razorpayPaymentId: data.razorpay_payment_id || null,
        currentPeriodStart: data.current_period_start || null,
        currentPeriodEnd: data.current_period_end || null,
        lastUsageDate: todayStr,
      };
    }
  } catch (err) {
    console.warn("Exception fetching user subscription, using fallback default:", err);
  }

  // Default Free Plan fallback if no DB record exists
  const defaultSub: UserSubscriptionDetails = {
    userId,
    planName: "Free",
    planLimit: 5,
    dailyUsageCount: 0,
    remainingApplies: 5,
    isUnlimited: false,
    status: "active",
    paymentStatus: "free",
    lastUsageDate: todayStr,
  };

  // Attempt to initialize Free subscription in database
  try {
    await supabase.from("user_subscriptions").upsert(
      {
        user_id: userId,
        plan_name: "Free",
        plan_limit: 5,
        daily_usage_count: 0,
        last_usage_date: todayStr,
        status: "active",
        payment_status: "free",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (e) {
    // Ignore schema errors if table creation is pending
  }

  return defaultSub;
}

export async function checkDailyApplyLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<LimitCheckResult> {
  const sub = await getUserSubscription(supabase, userId);

  if (sub.isUnlimited) {
    return {
      allowed: true,
      planName: "Unlimited",
      limit: -1,
      used: sub.dailyUsageCount,
      remaining: "Unlimited",
    };
  }

  if (sub.planName === "Free" && sub.dailyUsageCount >= 5) {
    return {
      allowed: false,
      planName: "Free",
      limit: 5,
      used: sub.dailyUsageCount,
      remaining: 0,
      message:
        "You have reached your Free plan limit of 5 AI job applies for today. Upgrade to Pro (25 applies/day) or Unlimited to continue applying!",
    };
  }

  if (sub.planName === "Pro" && sub.dailyUsageCount >= 25) {
    return {
      allowed: false,
      planName: "Pro",
      limit: 25,
      used: sub.dailyUsageCount,
      remaining: 0,
      message:
        "You have reached your Pro plan limit of 25 AI job applies for today. Upgrade to Unlimited for unrestricted applications!",
    };
  }

  return {
    allowed: true,
    planName: sub.planName,
    limit: sub.planLimit,
    used: sub.dailyUsageCount,
    remaining: sub.remainingApplies,
  };
}

export async function incrementDailyApplyCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const todayStr = getTodayDateString();
  const sub = await getUserSubscription(supabase, userId);

  const newCount = sub.dailyUsageCount + 1;

  try {
    await supabase.from("user_subscriptions").upsert(
      {
        user_id: userId,
        plan_name: sub.planName,
        plan_limit: sub.planLimit,
        daily_usage_count: newCount,
        last_usage_date: todayStr,
        status: sub.status,
        payment_status: sub.paymentStatus,
        razorpay_customer_id: sub.razorpayCustomerId,
        razorpay_subscription_id: sub.razorpaySubscriptionId,
        razorpay_order_id: sub.razorpayOrderId,
        razorpay_payment_id: sub.razorpayPaymentId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.warn("Could not increment daily usage count in DB:", err);
  }

  return newCount;
}

export async function updateUserSubscriptionFromRazorpay(
  supabase: SupabaseClient,
  payload: {
    userId: string;
    planName: "Pro" | "Unlimited";
    razorpayCustomerId?: string;
    razorpaySubscriptionId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    status?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    paymentStatus?: string;
  }
): Promise<void> {
  const planLimit = payload.planName === "Pro" ? 25 : -1;
  const todayStr = getTodayDateString();

  const updateData = {
    user_id: payload.userId,
    plan_name: payload.planName,
    plan_limit: planLimit,
    razorpay_customer_id: payload.razorpayCustomerId || null,
    razorpay_subscription_id: payload.razorpaySubscriptionId || null,
    razorpay_order_id: payload.razorpayOrderId || null,
    razorpay_payment_id: payload.razorpayPaymentId || null,
    status: payload.status || "active",
    payment_status: payload.paymentStatus || "paid",
    current_period_start: payload.currentPeriodStart || new Date().toISOString(),
    current_period_end: payload.currentPeriodEnd || null,
    last_usage_date: todayStr,
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from("user_subscriptions").upsert(updateData, {
      onConflict: "user_id",
    });
  } catch (err) {
    console.error("Error saving Razorpay subscription to database:", err);
  }
}
