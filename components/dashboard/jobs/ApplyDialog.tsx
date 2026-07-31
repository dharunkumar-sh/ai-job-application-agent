"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  Edit3,
  User,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  UploadCloud,
  FileText,
  Save,
  Zap,
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

  const [step, setStep] = useState<
    "choice" | "processing" | "missing_profile" | "fill_missing" | "submitted" | "limit_reached"
  >("choice");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [detectedPlatform, setDetectedPlatform] = useState<string>("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  // Missing Fields Form State
  const [missingForm, setMissingForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
  });
  const [missingResumeFile, setMissingResumeFile] = useState<File | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [savingMissing, setSavingMissing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!open || !job) return null;

  const resetState = () => {
    setStep("choice");
    setLoading(false);
    setErrorMsg(null);
    setMissingFields([]);
    setSessionId(null);
    setDebugUrl(null);
    setMissingForm({
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
    });
    setMissingResumeFile(null);
    setCustomFields({});
    setSavingMissing(false);
    setSaveError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const fetchCurrentProfile = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setMissingForm({
            fullName: profile.full_name || user.user_metadata?.full_name || "",
            email: profile.email || user.email || "",
            phone: profile.phone || "",
            location: profile.location || "",
            linkedin: profile.links?.linkedin || "",
          });
        } else {
          setMissingForm({
            fullName: user.user_metadata?.full_name || "",
            email: user.email || "",
            phone: "",
            location: "",
            linkedin: "",
          });
        }
      }
    } catch (e) {
      console.warn("Could not prefill missing profile form:", e);
    }
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
          job: job,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached || res.status === 403) {
          setErrorMsg(data.error || "Daily apply limit reached.");
          setStep("limit_reached");
          return;
        }
        throw new Error(data.error || "Auto-apply process failed");
      }

      setSessionId(data.sessionId || null);
      setDebugUrl(data.debugUrl || null);

      if (data.status === "Missing Profile Info") {
        setMissingFields(data.missingFields || ["Required Contact Fields"]);
        await fetchCurrentProfile();
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

  const handleOpenFillMissing = async () => {
    await fetchCurrentProfile();
    setStep("fill_missing");
  };

  const handleSaveAndRetryAutoApply = async () => {
    setSavingMissing(true);
    setSaveError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User session expired. Please sign in again.");
      }

      // 1. Upload resume if user selected a missing resume file
      if (missingResumeFile) {
        const formData = new FormData();
        formData.append("file", missingResumeFile);
        const uploadRes = await fetch("/api/resume/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || uploadData.error) {
          throw new Error(uploadData.error || "Failed to upload resume file.");
        }
      }

      // 2. Fetch existing profile to preserve unchanged properties
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const existingLinks = existingProfile?.links || {};

      const updatedFullName =
        missingForm.fullName.trim() ||
        existingProfile?.full_name ||
        user.user_metadata?.full_name ||
        "";
      const updatedEmail =
        missingForm.email.trim() || existingProfile?.email || user.email || "";
      const updatedPhone =
        missingForm.phone.trim() || existingProfile?.phone || "";
      const updatedLocation =
        missingForm.location.trim() || existingProfile?.location || "";
      const updatedLinkedin =
        missingForm.linkedin.trim() || existingProfile?.links?.linkedin || "";

      const updatedLinks = {
        ...existingLinks,
        ...(updatedLinkedin ? { linkedin: updatedLinkedin } : {}),
      };

      const profilePayload = {
        id: user.id,
        full_name: updatedFullName,
        email: updatedEmail,
        phone: updatedPhone,
        location: updatedLocation,
        links: updatedLinks,
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (upsertErr) {
        throw new Error(upsertErr.message || "Failed to save profile details.");
      }

      // Cache updated profile info in localStorage for instant UI sync
      try {
        const cached = localStorage.getItem("jobbuddy_parsed_profile");
        const parsed = cached ? JSON.parse(cached) : {};
        const updatedCache = {
          ...parsed,
          fullName: updatedFullName,
          email: updatedEmail,
          phone: updatedPhone,
          location: updatedLocation,
          links: updatedLinks,
        };
        localStorage.setItem(
          "jobbuddy_parsed_profile",
          JSON.stringify(updatedCache)
        );
      } catch (e) {
        console.warn("Could not update local profile cache:", e);
      }

      // 3. Re-trigger auto-apply process with updated database info!
      await handleApplyAutomatically();
    } catch (err: any) {
      console.error("Save & retry error:", err);
      setSaveError(err.message || "An error occurred while saving profile info.");
    } finally {
      setSavingMissing(false);
    }
  };

  const handleRedirectToProfile = () => {
    const missingParam = encodeURIComponent(missingFields.join(","));
    handleClose();
    router.push(`/dashboard/profile?missing=${missingParam}&jobId=${job.id}`);
  };

  // Determine which fields to display in the missing form view
  const isGenericMissing =
    missingFields.length === 0 ||
    missingFields.includes("Required Contact Fields");
  const showFullName = isGenericMissing || missingFields.includes("Full Name");
  const showEmail = isGenericMissing || missingFields.includes("Email Address");
  const showPhone = isGenericMissing || missingFields.includes("Phone Number");
  const showLocation =
    isGenericMissing || missingFields.includes("Preferred Location");
  const showLinkedin =
    isGenericMissing || missingFields.includes("LinkedIn Profile URL");
  const showResume = missingFields.includes("Uploaded Resume");

  // Extra unknown custom missing fields
  const customMissingFieldNames = missingFields.filter(
    (f) =>
      ![
        "Full Name",
        "Email Address",
        "Phone Number",
        "Preferred Location",
        "LinkedIn Profile URL",
        "Uploaded Resume",
        "Required Contact Fields",
      ].includes(f)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#16161b] border border-[#23232b] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col justify-between overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#0f0f12] text-zinc-400 hover:text-white hover:border-[#23232b] border border-transparent transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 shrink-0">
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
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span>{job.platform}</span>
            </span>
          </p>
        </div>

        {/* STEP 1: CHOICE STEP */}
        {step === "choice" && (
          <div className="space-y-4 pt-2 overflow-y-auto">
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

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-extrabold text-white group-hover:text-[#57cc99] transition-colors leading-snug">
                        Apply Automatically using AI Agent
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#57cc99] text-[#0f0f12] shrink-0 whitespace-nowrap self-start mt-0.5 shadow-sm">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Detects form fields with JobBuddy AI, checks profile completeness, auto-fills candidate data & resume, and submits automatically.
                    </p>
                    <div className="text-[11px] text-[#57cc99] font-medium pt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
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
          <div className="py-8 text-center space-y-6 overflow-y-auto">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#57cc99]/20 border-t-[#57cc99] animate-spin" />
              <div className="w-full h-full rounded-full flex items-center justify-center text-[#57cc99]">
                <Bot className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">
                JobBuddy AI Agent is Applying...
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Opening JobBuddy AI session, detecting form fields on {detectedPlatform}, and auditing candidate profile.
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

        {/* STEP 3: MISSING PROFILE INFO ALERT STEP */}
        {step === "missing_profile" && (
          <div className="space-y-5 pt-2 overflow-y-auto">
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

            {/* Session Note */}
            {sessionId && (
              <div className="text-[11px] text-zinc-500 flex items-center justify-between px-1">
                <span>Browserbase Session ID: {sessionId}</span>
                <span className="text-[#57cc99]">Status: Missing Profile Info</span>
              </div>
            )}

            {/* Option Buttons: Fill Data Now vs Go to Profile */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleOpenFillMissing}
                className="w-full py-3.5 px-5 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-xs rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Quick Fill Missing Data & Auto-Apply</span>
              </button>

              <div className="flex items-center gap-3">
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
                  className="flex-1 py-3 px-4 bg-[#0f0f12] hover:bg-[#1a1a22] border border-[#23232b] text-zinc-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Full Profile Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: FILL MISSING DATA DIALOG FORM */}
        {step === "fill_missing" && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#57cc99]" />
                <span>Fill Missing Application Information</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Enter missing details below. They will be saved to your database profile and used for submitting your application.
              </p>
            </div>

            {saveError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {/* Full Name */}
              {showFullName && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#57cc99]" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={missingForm.fullName}
                    onChange={(e) =>
                      setMissingForm({ ...missingForm, fullName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] transition-colors"
                  />
                </div>
              )}

              {/* Email Address */}
              {showEmail && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#57cc99]" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. alex@example.com"
                    value={missingForm.email}
                    onChange={(e) =>
                      setMissingForm({ ...missingForm, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] transition-colors"
                  />
                </div>
              )}

              {/* Phone Number */}
              {showPhone && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#57cc99]" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={missingForm.phone}
                    onChange={(e) =>
                      setMissingForm({ ...missingForm, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] transition-colors"
                  />
                </div>
              )}

              {/* Preferred Location */}
              {showLocation && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#57cc99]" />
                    <span>Preferred Location *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New York, NY or Remote"
                    value={missingForm.location}
                    onChange={(e) =>
                      setMissingForm({ ...missingForm, location: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] transition-colors"
                  />
                </div>
              )}

              {/* LinkedIn Profile URL */}
              {showLinkedin && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#57cc99]" />
                    <span>LinkedIn Profile URL *</span>
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://linkedin.com/in/alexjohnson"
                    value={missingForm.linkedin}
                    onChange={(e) =>
                      setMissingForm({ ...missingForm, linkedin: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] transition-colors"
                  />
                </div>
              )}

              {/* Upload Resume File */}
              {showResume && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#57cc99]" />
                    <span>Upload Resume File *</span>
                  </label>
                  <div className="border border-dashed border-[#23232b] bg-[#0f0f12] rounded-xl p-3 text-center">
                    <input
                      type="file"
                      id="missing-resume-input"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMissingResumeFile(e.target.files[0]);
                        }
                      }}
                    />
                    {missingResumeFile ? (
                      <div className="flex items-center justify-between text-xs text-[#57cc99]">
                        <span className="truncate font-semibold max-w-[280px]">
                          {missingResumeFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMissingResumeFile(null)}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("missing-resume-input")?.click()
                        }
                        className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-4 h-4 text-[#57cc99]" />
                        <span>Select PDF, DOCX, or TXT file</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Extra Missing Fields */}
              {customMissingFieldNames.map((fieldName) => (
                <div key={fieldName} className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {fieldName} *
                  </label>
                  <input
                    type="text"
                    placeholder={`Enter ${fieldName}`}
                    value={customFields[fieldName] || ""}
                    onChange={(e) =>
                      setCustomFields({
                        ...customFields,
                        [fieldName]: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("missing_profile")}
                disabled={savingMissing}
                className="px-4 py-3 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-zinc-400 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleSaveAndRetryAutoApply}
                disabled={savingMissing}
                className="flex-1 py-3 px-5 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-xs rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {savingMissing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving & Submitting...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save to Profile & Auto-Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUBMITTED SUCCESS STEP */}
        {step === "submitted" && (
          <div className="py-6 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-[#57cc99]/20 text-[#57cc99] border border-[#57cc99]/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Your application for{" "}
                <span className="text-white font-semibold">{job.title}</span> at{" "}
                <span className="text-white font-semibold">{job.company}</span> has been
                submitted via JobBuddy AI Agent.
              </p>
            </div>

            {sessionId && (
              <div className="p-3.5 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-xs text-zinc-400 space-y-1.5 text-left max-w-md mx-auto">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-500">JobBuddy Session ID:</span>
                  <span className="text-[#57cc99] font-bold truncate max-w-[200px]">
                    {sessionId}
                  </span>
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

        {/* STEP 6: DAILY APPLY LIMIT REACHED */}
        {step === "limit_reached" && (
          <div className="py-6 text-center space-y-6 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Zap className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Daily Apply Limit Reached</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                {errorMsg ||
                  "You have reached your daily limit of AI job applies. Upgrade your plan to continue applying automatically!"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Available Upgrade Options:
              </div>
              <div className="flex items-center justify-between text-zinc-200 pt-1 border-t border-[#23232b]">
                <span className="font-semibold">Pro Plan (25 Applies / day)</span>
                <span className="font-bold text-[#57cc99]">$19 / mo</span>
              </div>
              <div className="flex items-center justify-between text-zinc-200 pt-1 border-t border-[#23232b]">
                <span className="font-semibold">Unlimited Plan (Unlimited)</span>
                <span className="font-bold text-[#57cc99]">$49 / mo</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-300 font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  router.push("/dashboard/billing");
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#57cc99] to-[#80ed99] text-[#0f0f12] font-black text-xs rounded-2xl shadow-lg shadow-[#57cc99]/20 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade Plan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

