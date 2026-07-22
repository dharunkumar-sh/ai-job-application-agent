"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ExternalLink,
  Bot,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  ShieldCheck,
  Globe,
  FileCheck,
} from "lucide-react";
import { JobRecord } from "./JobCard";

interface ApplyDialogProps {
  open: boolean;
  onClose: () => void;
  job: JobRecord | null;
  onApplicationUpdated?: () => void;
}

export function ApplyDialog({
  open,
  onClose,
  job,
  onApplicationUpdated,
}: ApplyDialogProps) {
  const router = useRouter();

  const [step, setStep] = useState<"choice" | "processing" | "missing_profile" | "submitted">("choice");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [detectedPlatform, setDetectedPlatform] = useState<string>("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  if (!open || !job) return null;

  const resetState = () => {
    setStep("choice");
    setLoading(false);
    setErrorMsg(null);
    setMissingFields([]);
    setSessionId(null);
    setDebugUrl(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleApplyManually = async () => {
    if (job.job_url) {
      window.open(job.job_url, "_blank", "noopener,noreferrer");
    }

    try {
      await fetch("/api/applications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          platform: job.platform,
          notes: "Applied manually via external link",
        }),
      });
      if (onApplicationUpdated) onApplicationUpdated();
    } catch (e) {
      console.warn("Could not log manual application:", e);
    }

    handleClose();
  };

  const handleApplyAutomatically = async () => {
    setStep("processing");
    setLoading(true);
    setErrorMsg(null);
    setDetectedPlatform(job.platform || "General ATS");

    try {
      const res = await fetch("/api/applications/auto-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobUrl: job.job_url,
          platform: job.platform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Auto-apply process failed");
      }

      setSessionId(data.sessionId || null);
      setDebugUrl(data.debugUrl || null);

      if (data.status === "Missing Profile Info") {
        setMissingFields(data.missingFields || ["Required Contact Fields"]);
        setStep("missing_profile");
      } else if (data.status === "Submitted") {
        setStep("submitted");
        if (onApplicationUpdated) onApplicationUpdated();
      } else {
        setStep("submitted");
        if (onApplicationUpdated) onApplicationUpdated();
      }
    } catch (err: any) {
      console.error("Auto apply error:", err);
      setErrorMsg(err.message || "Automation error occurred");
      setStep("choice");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToProfile = () => {
    const missingParam = encodeURIComponent(missingFields.join(","));
    handleClose();
    router.push(`/dashboard/profile?missing=${missingParam}&jobId=${job.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#16161b] border border-[#23232b] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#0f0f12] text-zinc-400 hover:text-white hover:border-[#23232b] border border-transparent transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#57cc99]">
            <Sparkles className="w-4 h-4" />
            <span>Job Buddy AI Application Assistant</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Apply to {job.title}
          </h2>
          <p className="text-xs text-zinc-400">
            {job.company} • {job.location || "Remote"} • Platform:{" "}
            <span className="inline-flex items-center gap-1.5 text-white font-semibold align-middle">
              <img
                src={`/${job.platform.toLowerCase()}.png`}
                alt={job.platform}
                className="w-3.5 h-3.5 object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
              />
              <span>{job.platform}</span>
            </span>
          </p>
        </div>

        {/* STEP 1: CHOICE STEP */}
        {step === "choice" && (
          <div className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5">
              {/* Option 1: Apply Automatically using AI Agent */}
              <button
                type="button"
                onClick={handleApplyAutomatically}
                className="group p-5 rounded-2xl bg-gradient-to-br from-[#1e1e28] to-[#141419] border border-[#57cc99]/30 hover:border-[#57cc99] text-left transition-all shadow-lg hover:shadow-[#57cc99]/10 cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#57cc99]/10 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] shrink-0 group-hover:scale-105 transition-transform">
                    <Bot className="w-6 h-6" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-white group-hover:text-[#57cc99] transition-colors">
                        Apply Automatically using AI Agent
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#57cc99] text-[#0f0f12]">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Detects form fields with Stagehand, checks profile completeness, auto-fills candidate data & resume, and submits via Browserbase.
                    </p>
                    <div className="text-[11px] text-[#57cc99] font-medium pt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Platform Detected: {job.platform}</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: Apply Manually */}
              <button
                type="button"
                onClick={handleApplyManually}
                className="group p-5 rounded-2xl bg-[#0f0f12] border border-[#23232b] hover:border-zinc-700 text-left transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#16161b] border border-[#23232b] flex items-center justify-center text-zinc-400 shrink-0">
                    <ExternalLink className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                      Apply Manually
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Navigates directly to the official job posting page on {job.platform} in a new browser tab.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROCESSING / AUTOMATION IN PROGRESS */}
        {step === "processing" && (
          <div className="py-8 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#57cc99]/20 border-t-[#57cc99] animate-spin" />
              <div className="w-full h-full rounded-full flex items-center justify-center text-[#57cc99]">
                <Bot className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">
                Browserbase AI Agent is Applying...
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Opening Browserbase session, detecting form fields on {detectedPlatform}, and auditing candidate profile.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-[#57cc99]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-semibold">Step 1: Detecting required form fields</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Step 2: Comparing with candidate profile data</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Globe className="w-3.5 h-3.5" />
                <span>Step 3: Auto-filling & submitting application</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: MISSING PROFILE INFO STEP */}
        {step === "missing_profile" && (
          <div className="space-y-5 pt-2">
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Action Required: Missing Profile Information</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                The {detectedPlatform} job application requires candidate information that is currently missing from your saved profile.
              </p>

              {/* Missing Fields List */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  Missing Required Fields:
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-200 flex items-center gap-1.5"
                    >
                      <span>• {field}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Browserbase Session Note */}
            {sessionId && (
              <div className="text-[11px] text-zinc-500 flex items-center justify-between px-1">
                <span>Browserbase Session ID: {sessionId}</span>
                <span className="text-[#57cc99]">Status: Missing Profile Info</span>
              </div>
            )}

            {/* Redirect Action Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-3 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-zinc-400 hover:text-white text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRedirectToProfile}
                className="flex-1 py-3 px-5 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-xs rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Complete Profile Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUBMITTED SUCCESS STEP */}
        {step === "submitted" && (
          <div className="py-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#57cc99]/20 text-[#57cc99] border border-[#57cc99]/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Your application for <span className="text-white font-semibold">{job.title}</span> at <span className="text-white font-semibold">{job.company}</span> has been submitted via Browserbase AI Agent.
              </p>
            </div>

            {sessionId && (
              <div className="p-3.5 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-xs text-zinc-400 space-y-1.5 text-left max-w-md mx-auto">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-500">Browserbase Session ID:</span>
                  <span className="text-[#57cc99] font-bold truncate max-w-[200px]">{sessionId}</span>
                </div>
                {debugUrl && (
                  <a
                    href={debugUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline pt-1"
                  >
                    <span>View Live Session Debug Replay</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 bg-[#57cc99] text-[#0f0f12] font-extrabold text-xs rounded-2xl shadow-lg shadow-[#57cc99]/20 hover:bg-[#46b887] transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
