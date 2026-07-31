"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowRight,
  Check,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
} from "lucide-react";
import { UserSubscriptionDetails } from "@/lib/subscriptions";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const checkoutPlan = searchParams.get("plan");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null); // plan name or "portal"
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [subscription, setSubscription] = useState<UserSubscriptionDetails | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionDetails();

    if (checkoutSuccess) {
      setNotice(
        `🎉 Congratulations! You have successfully subscribed to the ${
          checkoutPlan || "selected"
        } Plan.`
      );
    }
  }, [checkoutSuccess, checkoutPlan]);

  const fetchSubscriptionDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/subscription");
      const data = await res.json();
      if (res.ok && data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error("Error loading subscription details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: "Pro" | "Unlimited") => {
    setSubmitting(planName);
    setNotice(null);

    const priceAmount =
      planName === "Pro"
        ? billingCycle === "monthly"
          ? 19
          : 180
        : billingCycle === "monthly"
        ? 49
        : 470;

    const interval = billingCycle === "monthly" ? "month" : "year";

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          priceAmount,
          interval,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate subscription");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        await fetchSubscriptionDetails();
      }
    } catch (err: any) {
      console.error("Subscription error:", err);
      alert(err.message || "Could not start checkout");
    } finally {
      setSubmitting(null);
    }
  };

  const handleManageSubscription = async () => {
    setSubmitting("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setSubmitting(null);
    }
  };

  const activePlanName = subscription?.planName || "Free";
  const dailyCount = subscription?.dailyUsageCount || 0;
  const isUnlimited = subscription?.isUnlimited || activePlanName === "Unlimited";
  const planLimit = isUnlimited ? -1 : subscription?.planLimit || 5;

  const usagePercentage = isUnlimited
    ? 100
    : Math.min(100, Math.round((dailyCount / (planLimit || 1)) * 100));

  const plans = [
    {
      name: "Free",
      description: "Essential AI job search automation for casual job seekers.",
      monthlyPrice: 0,
      annualPrice: 0,
      limitText: "5 AI Job Applies / day",
      features: [
        "Maximum 5 AI job applies per day",
        "Stagehand AI form field detection",
        "Automated candidate profile filling",
        "Resume attachment support",
        "Basic application status tracking",
      ],
      highlight: false,
    },
    {
      name: "Pro",
      description: "High-volume AI job applications for active candidates.",
      monthlyPrice: 19,
      annualPrice: 15,
      limitText: "25 AI Job Applies / day",
      features: [
        "Maximum 25 AI job applies per day",
        "Priority Stagehand AI form filling",
        "Automatic work authorization & visa screening",
        "Instant missing profile field quick-fill",
        "Live Browserbase session debug replays",
        "Priority customer support",
      ],
      highlight: true,
      badge: "Most Popular",
    },
    {
      name: "Unlimited",
      description: "Unrestricted AI job apply capacity for aggressive job hunting.",
      monthlyPrice: 49,
      annualPrice: 39,
      limitText: "Unlimited AI Job Applies / day",
      features: [
        "Unlimited AI job applies per day",
        "Zero daily apply limits or restrictions",
        "Ultra-fast Browserbase AI agent execution",
        "Automated EEOC & voluntary disclosure answers",
        "Unlimited saved jobs & application history",
        "1-on-1 dedicated customer support",
      ],
      highlight: false,
      badge: "Maximum Power",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16161b] border border-[#23232b] p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing & Subscriptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Subscription & Usage
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your active plan, track daily AI job apply usage, and upgrade for unrestricted automation.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSubscriptionDetails}
          disabled={loading}
          className="px-5 py-3.5 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-200 hover:text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-[#57cc99] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Details</span>
        </button>
      </div>

      {/* Success / Alert Notice */}
      {notice && (
        <div className="p-4 rounded-2xl bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-bold flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs hover:underline text-white font-normal"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-COLUMN OVERVIEW CARDS: 1. Current Plan | 2. Usage Info | 3. Manage Subscription */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SECTION 1: Current Plan */}
        <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Current Active Plan</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  activePlanName === "Unlimited"
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                    : activePlanName === "Pro"
                    ? "bg-[#57cc99]/10 text-[#57cc99] border-[#57cc99]/30"
                    : "bg-zinc-500/10 text-zinc-300 border-zinc-500/30"
                }`}
              >
                {activePlanName} Plan
              </span>
            </div>

            <div className="pt-2 space-y-1">
              <div className="text-2xl font-black text-white">
                {activePlanName === "Free"
                  ? "$0 / month"
                  : activePlanName === "Pro"
                  ? "$19 / month"
                  : "$49 / month"}
              </div>
              <div className="text-xs text-zinc-400 font-medium">
                {isUnlimited ? "Unlimited AI Applies per day" : `${planLimit} AI Applies per day`}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#23232b] space-y-2 text-xs text-zinc-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#57cc99]" />
                Subscription Status:
              </span>
              <span className="font-bold text-white uppercase">{subscription?.status || "Active"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Payment Status:
              </span>
              <span className="font-bold text-white capitalize">{subscription?.paymentStatus || "Free"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Usage Information */}
        <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Today's AI Apply Usage</span>
              <span className="text-xs font-bold text-[#57cc99]">
                {isUnlimited ? "Unlimited Usage" : `${dailyCount} / ${planLimit} Applies`}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-3 rounded-full bg-[#0f0f12] border border-[#23232b] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isUnlimited
                      ? "bg-gradient-to-r from-purple-500 to-[#57cc99]"
                      : usagePercentage >= 100
                      ? "bg-rose-500"
                      : usagePercentage >= 80
                      ? "bg-amber-400"
                      : "bg-gradient-to-r from-[#57cc99] to-[#80ed99]"
                  }`}
                  style={{ width: `${isUnlimited ? 100 : usagePercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span>Used Today: {dailyCount}</span>
                <span>
                  {isUnlimited
                    ? "Unlimited"
                    : `${Math.max(0, planLimit - dailyCount)} Applies Remaining`}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#23232b] text-xs text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Daily Limit Resets:
            </span>
            <span className="font-semibold text-white">Midnight (00:00 UTC)</span>
          </div>
        </div>

        {/* SECTION 3: Manage Subscription */}
        <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#57cc99]" />
              Manage Subscription
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Update your payment methods, download invoices, or change plan settings directly via Stripe.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={submitting === "portal"}
              className="w-full py-3 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-200 hover:text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {submitting === "portal" ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#57cc99]" />
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 text-[#57cc99]" />
                  <span>Stripe Billing Portal</span>
                </>
              )}
            </button>

            {activePlanName !== "Unlimited" && (
              <a
                href="#available-plans"
                className="w-full py-3 bg-[#57cc99]/10 hover:bg-[#57cc99]/20 border border-[#57cc99]/30 text-[#57cc99] font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade Plan</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: Available Plans (Pricing Cards) */}
      <div id="available-plans" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Available Subscription Plans
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Choose the right plan to automate your job application workflow.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 bg-[#16161b] border border-[#23232b] rounded-2xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[#57cc99] text-[#0f0f12] shadow-md shadow-[#57cc99]/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "annual"
                  ? "bg-[#57cc99] text-[#0f0f12] shadow-md shadow-[#57cc99]/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-[#0f0f12] text-[9px] font-black uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = activePlanName === plan.name;
            const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;

            return (
              <div
                key={plan.name}
                className={`relative bg-[#16161b] border rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 shadow-xl ${
                  plan.highlight
                    ? "border-[#57cc99] shadow-[#57cc99]/10 ring-1 ring-[#57cc99]"
                    : "border-[#23232b] hover:border-zinc-700"
                }`}
              >
                {/* Badge Header */}
                {plan.badge && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-[#57cc99] to-[#80ed99] text-[#0f0f12] text-[10px] font-black uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{plan.name} Plan</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="pt-2 pb-2 border-y border-[#23232b]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">${price}</span>
                      <span className="text-xs text-zinc-400 font-semibold">
                        / {billingCycle === "monthly" ? "month" : "month (billed annually)"}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-xl bg-[#0f0f12] border border-[#23232b] text-[#57cc99] text-xs font-bold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{plan.limitText}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Included Features:
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#57cc99] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-4">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3.5 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-zinc-500 font-bold text-xs cursor-default flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#57cc99]" />
                      <span>Current Active Plan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan.name as "Pro" | "Unlimited")}
                      disabled={submitting === plan.name || plan.name === "Free"}
                      className={`w-full py-3.5 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                        plan.name === "Free"
                          ? "bg-[#0f0f12] text-zinc-400 border border-[#23232b]"
                          : plan.highlight
                          ? "bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] shadow-lg shadow-[#57cc99]/20"
                          : "bg-[#1e1e26] hover:bg-[#282833] text-white border border-[#23232b]"
                      } disabled:opacity-50`}
                    >
                      {submitting === plan.name ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0f0f12]" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {plan.name === "Free"
                              ? "Free Tier"
                              : `Upgrade to ${plan.name}`}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
