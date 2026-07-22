"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Sparkles,
  ExternalLink,
  Bookmark,
  Check,
  Award,
  Layers,
} from "lucide-react";
import { JobPlatform } from "./PlatformSelector";

export interface JobRecord {
  id: string;
  user_id?: string;
  platform: JobPlatform | string;
  title: string;
  company: string;
  company_logo?: string;
  location?: string;
  salary?: string;
  job_type?: string;
  experience_level?: string;
  description?: string;
  tags?: string[] | any;
  match_score: number;
  job_url: string;
  source_url?: string;
  applied_status?: boolean;
  saved_status?: boolean;
  fetched_at?: string;
  created_at?: string;
}

interface JobCardProps {
  job: JobRecord;
  onToggleSave: (jobId: string, currentSaved: boolean) => Promise<void>;
  onApply?: (job: JobRecord) => void;
}

export function JobCard({ job, onToggleSave, onApply }: JobCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(job.saved_status));

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    const newSavedState = !saved;
    setSaved(newSavedState); // Optimistic UI update
    try {
      await onToggleSave(job.id, !saved);
    } catch (err) {
      setSaved(saved); // Revert on failure
      console.error("Save toggle error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApply) {
      onApply(job);
    } else if (job.job_url) {
      window.open(job.job_url, "_blank", "noopener,noreferrer");
    }
  };

  // Get Platform Color Styling & Logo
  const getPlatformBadge = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case "greenhouse":
        return {
          logo: "/greenhouse.png",
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
        };
      case "lever":
        return {
          logo: "/lever.png",
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          border: "border-blue-500/30",
        };
      case "workable":
        return {
          logo: "/workable.png",
          bg: "bg-purple-500/10",
          text: "text-purple-400",
          border: "border-purple-500/30",
        };
      case "wellfound":
        return {
          logo: "/wellfound.png",
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/30",
        };
      default:
        return {
          logo: "",
          bg: "bg-zinc-500/10",
          text: "text-zinc-400",
          border: "border-zinc-500/30",
        };
    }
  };

  const platformBadge = getPlatformBadge(job.platform);
  const formattedTags = Array.isArray(job.tags) ? job.tags : [];
  const matchScore = job.match_score || 85;

  return (
    <div className="group relative bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/40 rounded-3xl p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#57cc99]/5 flex flex-col justify-between">
      {/* Top Header: Logo, Company, Title & Platform Badge */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Company Logo / Initials */}
            <div className="w-12 h-12 rounded-2xl bg-[#0f0f12] border border-[#23232b] p-1.5 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-[#57cc99]/30 transition-colors">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    // Fallback on image error
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Building2 className="w-6 h-6 text-[#57cc99]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 truncate">
                <span className="truncate">{job.company}</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#57cc99] transition-colors line-clamp-2 leading-snug mt-0.5">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Platform Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 flex items-center gap-1.5 ${platformBadge.bg} ${platformBadge.text} ${platformBadge.border}`}
          >
            {platformBadge.logo && (
              <img
                src={platformBadge.logo}
                alt={job.platform}
                className="w-3.5 h-3.5 object-contain"
              />
            )}
            <span>{job.platform}</span>
          </span>
        </div>

        {/* Job Details Pills: Location, Salary, Job Type, Experience */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {job.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0f0f12] border border-[#23232b] text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-[#57cc99]" />
              <span>{job.location}</span>
            </span>
          )}

          {job.salary && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0f0f12] border border-[#23232b] text-zinc-300">
              <DollarSign className="w-3.5 h-3.5 text-[#57cc99]" />
              <span>{job.salary}</span>
            </span>
          )}

          {job.job_type && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0f0f12] border border-[#23232b] text-zinc-300">
              <Briefcase className="w-3.5 h-3.5 text-[#57cc99]" />
              <span>{job.job_type}</span>
            </span>
          )}

          {job.experience_level && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0f0f12] border border-[#23232b] text-zinc-300">
              <Award className="w-3.5 h-3.5 text-[#57cc99]" />
              <span>{job.experience_level}</span>
            </span>
          )}
        </div>

        {/* Short Job Description Snippet */}
        {job.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed pt-1">
            {job.description}
          </p>
        )}

        {/* Skill Tags */}
        {formattedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {formattedTags.map((tag: string, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg bg-[#0f0f12] border border-[#23232b] text-[11px] text-zinc-300 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Match Progress Bar & Action Buttons */}
      <div className="mt-6 pt-4 border-t border-[#23232b] space-y-4">
        {/* Match Percentage & Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#57cc99]" />
              <span>AI Match Score</span>
            </span>
            <span className="font-extrabold text-[#57cc99]">{matchScore}% Match</span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-2 rounded-full bg-[#0f0f12] border border-[#23232b] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#57cc99] to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>

        {/* Action Buttons: Apply Now & Save */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleApplyClick}
            className="flex-1 py-2.5 px-4 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-xs rounded-xl shadow-md shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <span>Apply Now</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-[0.96] ${
              saved
                ? "bg-[#57cc99]/10 border-[#57cc99] text-[#57cc99]"
                : "bg-[#0f0f12] border-[#23232b] text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
            title={saved ? "Saved to your list" : "Save job"}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-[#57cc99]" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
