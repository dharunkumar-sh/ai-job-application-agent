"use client";

import { Check, Globe } from "lucide-react";

export type JobPlatform = "Greenhouse" | "Lever" | "Workable" | "Wellfound";

interface PlatformInfo {
  id: JobPlatform;
  name: string;
  domain: string;
  logo: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const PLATFORM_LIST: PlatformInfo[] = [
  {
    id: "Greenhouse",
    name: "Greenhouse",
    domain: "greenhouse.io",
    logo: "/greenhouse.png",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/30",
  },
  {
    id: "Lever",
    name: "Lever",
    domain: "lever.co",
    logo: "/lever.png",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
  },
  {
    id: "Workable",
    name: "Workable",
    domain: "workable.com",
    logo: "/workable.png",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/30",
  },
  {
    id: "Wellfound",
    name: "Wellfound",
    domain: "wellfound.com",
    logo: "/wellfound.png",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/30",
  },
];

interface PlatformSelectorProps {
  selectedPlatforms: JobPlatform[];
  platformCounts: Record<JobPlatform, number>;
  onTogglePlatform: (platform: JobPlatform) => void;
  onSelectAll: () => void;
}

export function PlatformSelector({
  selectedPlatforms,
  platformCounts,
  onTogglePlatform,
  onSelectAll,
}: PlatformSelectorProps) {
  const allSelected = selectedPlatforms.length === PLATFORM_LIST.length;

  return (
    <div className="space-y-3">
      {/* Header & Select All Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Target Job Platforms ({selectedPlatforms.length}/{PLATFORM_LIST.length} Active)
        </h2>

        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs font-semibold text-[#57cc99] hover:underline cursor-pointer"
        >
          {allSelected ? "Clear Filters" : "Select All Platforms"}
        </button>
      </div>

      {/* Grid of Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PLATFORM_LIST.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const count = platformCounts[platform.id] || 0;

          return (
            <div
              key={platform.id}
              onClick={() => onTogglePlatform(platform.id)}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                isSelected
                  ? `bg-[#16161b] border-[#57cc99] shadow-lg shadow-[#57cc99]/10`
                  : `bg-[#16161b]/60 border-[#23232b] hover:border-zinc-700 opacity-70 hover:opacity-100`
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Platform Name & Domain */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f0f12] border border-[#23232b] p-1.5 flex items-center justify-center shrink-0 shadow-md group-hover:border-[#57cc99]/30 transition-colors">
                    <img
                      src={platform.logo}
                      alt={platform.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#57cc99] transition-colors">
                      {platform.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>{platform.domain}</span>
                    </div>
                  </div>
                </div>

                {/* Checkbox / Active Indicator */}
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#57cc99] border-[#57cc99] text-[#0f0f12]"
                      : "bg-[#0f0f12] border-[#23232b] text-transparent"
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              {/* Bottom Badge with Job Count */}
              <div className="mt-3 pt-3 border-t border-[#23232b]/60 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Available Matches</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${platform.badgeBg} ${platform.badgeText} ${platform.badgeBorder}`}
                >
                  {count} jobs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
