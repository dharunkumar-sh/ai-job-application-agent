"use client";

import Link from "next/link";
import { UserCheck, Sparkles, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

export interface ProfileCompletenessData {
  hasName: boolean;
  hasHeadline: boolean;
  hasLocation: boolean;
  hasSkills: boolean;
  hasWorkExp: boolean;
  hasEducation: boolean;
}

interface ProfileCompletenessCardProps {
  data: ProfileCompletenessData;
}

export function ProfileCompletenessCard({ data }: ProfileCompletenessCardProps) {
  let score = 0;
  const items = [
    { label: "Basic Contact Info", done: data.hasName, weight: 15, tip: "Add full name and email" },
    { label: "Target Headline / Role", done: data.hasHeadline, weight: 20, tip: "Set target job title" },
    { label: "Preferred Location", done: data.hasLocation, weight: 15, tip: "Specify remote or city location" },
    { label: "Skills & Tech Stack", done: data.hasSkills, weight: 20, tip: "Add key technical skills" },
    { label: "Work Experience", done: data.hasWorkExp, weight: 15, tip: "Add previous positions" },
    { label: "Education & Projects", done: data.hasEducation, weight: 15, tip: "Add degree or portfolio link" },
  ];

  items.forEach((i) => {
    if (i.done) score += i.weight;
  });

  const pendingItems = items.filter((i) => !i.done);

  return (
    <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 space-y-5 shadow-xl">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#57cc99]/10 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Profile Completeness</h3>
            <p className="text-[11px] text-zinc-400">Better data improves AI matches</p>
          </div>
        </div>

        <span className="text-base font-black text-[#57cc99]">{score}%</span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 rounded-full bg-[#0f0f12] border border-[#23232b] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#57cc99] to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Checklist / Quick Tips */}
      <div className="space-y-2 pt-1">
        {pendingItems.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#57cc99]/10 border border-[#57cc99]/20 text-[#57cc99] text-xs font-semibold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Profile is 100% complete for optimal matching!</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Suggestions to boost score:
            </div>
            {pendingItems.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0f0f12] border border-[#23232b] text-xs"
              >
                <div className="flex items-center gap-2 text-zinc-300 truncate">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{item.tip}</span>
                </div>
                <span className="text-[11px] font-bold text-[#57cc99] shrink-0">
                  +{item.weight}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link to Edit Profile */}
      <Link
        href="/dashboard/profile"
        className="w-full py-2.5 px-4 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
      >
        <span>Complete Your Profile</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#57cc99] group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
