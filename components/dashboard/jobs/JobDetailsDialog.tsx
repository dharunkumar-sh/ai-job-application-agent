"use client";

import {
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Sparkles,
  ExternalLink,
  Bookmark,
  X,
  Award,
  Bot,
  FileText,
  CheckCircle2,
  Clock,
  Globe,
  Home,
  Building,
} from "lucide-react";
import { JobRecord, getWorkplaceType, formatPostedDuration, formatLocation } from "./JobCard";

interface JobDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  job: JobRecord | null;
  onApply: (job: JobRecord) => void;
  onToggleSave: (jobId: string, currentSaved: boolean) => Promise<void>;
}

function cleanAndFormatDescription(rawText: string = ""): string {
  if (!rawText) return "";

  // 1. Remove generic job-board template boilerplate artifacts & promotional text
  let text = rawText
    .replace(/Post this .*? job to over \d+ job boards at once\.?/gi, "")
    .replace(/Want to generate a unique job description\??/gi, "")
    .replace(/Frequently asked questions.*$/gi, "")
    .replace(/\[\.\.\.\]/g, "")
    .replace(/Want to post a job\??/gi, "");

  // 2. Remove duplicate empty headers
  text = text.replace(/##\s+Responsibilities\s+##\s+Requirements/gi, "## Requirements and skills");

  return text.trim();
}

function renderStructuredDescription(rawDescription: string = "") {
  const cleaned = cleanAndFormatDescription(rawDescription);

  if (!cleaned) {
    return <p className="text-xs text-[#57cc99]">No detailed description available for this position.</p>;
  }

  // Split by double line breaks or line endings to process blocks
  const lines = cleaned.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} className="space-y-1.5 my-2.5 pl-1">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#57cc99] mt-1.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if header line
    if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
      flushList(`hdr-${idx}`);
      const headerText = trimmed.replace(/^#+\s*/, "").replace(/^[\-\|]+|[\-\|]+$/g, "").trim();

      if (headerText) {
        elements.push(
          <div key={`hdr-${idx}`} className="mt-4 mb-2 first:mt-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#57cc99] border-l-2 border-[#57cc99] pl-2.5 py-0.5 flex items-center gap-1.5">
              <span>{headerText}</span>
            </h3>
          </div>
        );
      }
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      // List item
      const itemText = trimmed.replace(/^[\-\*\•]\s*/, "").trim();
      if (itemText) {
        currentList.push(itemText);
      }
    } else {
      flushList(`p-${idx}`);
      elements.push(
        <p key={`p-${idx}`} className="text-xs text-zinc-300 leading-relaxed my-2">
          {trimmed}
        </p>
      );
    }
  });

  flushList("final");

  return <div className="space-y-1">{elements}</div>;
}

export function JobDetailsDialog({
  open,
  onClose,
  job,
  onApply,
  onToggleSave,
}: JobDetailsDialogProps) {
  if (!open || !job) return null;

  const formattedTags = Array.isArray(job.tags) ? job.tags : [];
  const matchScore = job.match_score || 90;
  const workplaceType = getWorkplaceType(job);
  const postedDuration = formatPostedDuration(job.created_at || job.fetched_at);
  const displayLocation = formatLocation(job.location);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#16161b] border border-[#23232b] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar cursor-default"
      >
        {/* Header Section */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0f0f12] border border-[#23232b] p-2 flex items-center justify-center shrink-0">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company}
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <Building2 className="w-7 h-7 text-[#57cc99]" />
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 flex-wrap">
              <span>{job.company}</span>
              {displayLocation && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#57cc99]" />
                    <span>{displayLocation}</span>
                  </span>
                </>
              )}
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#57cc99]" />
                <span>{postedDuration}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] font-bold ml-auto">
                {job.platform}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
              {job.title}
            </h2>
          </div>
        </div>

        {/* Key Specification Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {displayLocation && (
            <div className="p-3 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Location
              </span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate">
                <MapPin className="w-3.5 h-3.5 text-[#57cc99] shrink-0" />
                <span className="truncate">{displayLocation}</span>
              </div>
            </div>
          )}

          {/* Workplace Type Card */}
          <div className="p-3 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Workplace Mode
            </span>
            <div className="flex items-center gap-1.5 text-[#57cc99] font-bold truncate">
              {workplaceType === "Online / Remote" ? (
                <Globe className="w-3.5 h-3.5 shrink-0" />
              ) : workplaceType === "Hybrid" ? (
                <Home className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Building className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{workplaceType}</span>
            </div>
          </div>

          {job.salary && (
            <div className="p-3 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Compensation
              </span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate">
                <DollarSign className="w-3.5 h-3.5 text-[#57cc99] shrink-0" />
                <span className="truncate">{job.salary}</span>
              </div>
            </div>
          )}

          {job.job_type && (
            <div className="p-3 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Employment Type
              </span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate">
                <Briefcase className="w-3.5 h-3.5 text-[#57cc99] shrink-0" />
                <span className="truncate">{job.job_type}</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Match Score Breakdown Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1e1e28] to-[#141419] border border-[#57cc99]/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#57cc99]">
              <Sparkles className="w-4 h-4" />
              <span>AI Match Rating & Skills Fit</span>
            </div>
            <span className="text-sm font-black text-[#57cc99]">
              {matchScore}% Match
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#0f0f12] overflow-hidden border border-[#23232b]">
            <div
              className="h-full bg-gradient-to-r from-[#57cc99] to-emerald-400 rounded-full"
              style={{ width: `${matchScore}%` }}
            />
          </div>

          {formattedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 font-medium self-center mr-1">
                Matched Technologies:
              </span>
              {formattedTags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-[11px] font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Full Job Description Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#57cc99]" />
            <span>Job Specifications & Duties</span>
          </h4>
          <div className="p-5 rounded-2xl bg-[#0f0f12] border border-[#23232b]">
            {renderStructuredDescription(job.description)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onApply(job);
            }}
            className="flex-1 py-3.5 px-5 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-xs rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Bot className="w-4 h-4" />
            <span>Apply with AI Agent</span>
          </button>

          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-zinc-300 hover:text-white hover:border-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>External Link</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            type="button"
            onClick={async () => {
              await onToggleSave(job.id, Boolean(job.saved_status));
            }}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
              job.saved_status
                ? "bg-[#57cc99]/10 border-[#57cc99] text-[#57cc99]"
                : "bg-[#0f0f12] border-[#23232b] text-zinc-400 hover:text-white"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${job.saved_status ? "fill-[#57cc99]" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

