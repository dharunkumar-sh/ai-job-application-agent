"use client";

import { Sparkles, RefreshCw, MapPin, Briefcase, Clock, ShieldCheck } from "lucide-react";

interface JobsWelcomeBannerProps {
  userName: string;
  userHeadline: string;
  userLocation: string;
  lastFetchedAt: string | null;
  isCached: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function JobsWelcomeBanner({
  userName,
  userHeadline,
  userLocation,
  lastFetchedAt,
  isCached,
  isRefreshing,
  onRefresh,
}: JobsWelcomeBannerProps) {
  const getFormattedTime = (dateStr: string | null) => {
    if (!dateStr) return "Just now";
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#16161b] border border-[#23232b] rounded-3xl p-6 md:p-8 shadow-2xl">
      {/* Background Subtle Mesh Gradient */}
      <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#57cc99]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Match Engine Active</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
            Top Matched Jobs for <span className="text-[#57cc99]">{userName || "Candidate"}</span>
          </h1>

          {/* Subtext with User Metadata */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 font-medium pt-1">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Briefcase className="w-3.5 h-3.5 text-[#57cc99]" />
              <span>{userHeadline || "Full Stack Engineer"}</span>
            </span>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-[#57cc99]" />
              <span>{userLocation || "Remote / San Francisco"}</span>
            </span>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Updated {getFormattedTime(lastFetchedAt)}</span>
            </span>
          </div>
        </div>

        {/* Action Controls & Cache Status */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto px-5 py-3 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-xs rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Syncing Latest Jobs..." : "Sync Fresh Jobs"}</span>
          </button>

          {/* Cache Status Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#57cc99]" />
            <span>
              {isCached ? "Loaded from Cache" : "Fresh Live Job Data"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
