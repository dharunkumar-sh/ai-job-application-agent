"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Loader2,
  Sparkles,
  Bot,
  AlertCircle,
  ShieldCheck
} from "lucide-react";

interface OnboardingDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingDialog({ isOpen, onComplete }: OnboardingDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsingStep, setParsingStep] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) {
      setErrorMsg("Please select a resume file (PDF, TXT, or DOCX).");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setParsingStep("Uploading resume...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setTimeout(() => {
        setParsingStep("Analyzing resume content with AI...");
      }, 1200);

      setTimeout(() => {
        setParsingStep("Extracting profile, skills, experiences, and education...");
      }, 2800);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to process resume");
      }

      // Save to local storage cache for instant UI population
      if (data.parsedData) {
        localStorage.setItem("jobbuddy_parsed_profile", JSON.stringify(data.parsedData));
      }

      setParsingStep("Saving extracted details...");

      setTimeout(() => {
        setUploading(false);
        onComplete();
        router.push("/dashboard/profile");
        router.refresh();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setUploading(false);
      setParsingStep(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#0f0f12]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4 selection:bg-[#57cc99] selection:text-[#0f0f12]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-[#16161b] border border-[#23232b] rounded-3xl p-8 shadow-2xl shadow-black relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#57cc99]/15 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#57cc99] via-[#46b887] to-[#80ed99] text-[#0f0f12] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#57cc99]/20">
            <Bot className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to JobBuddy AI</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Upload Your Resume
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Please upload your resume to get started. Our AI will automatically parse your skills, experience, and profile details.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Container */}
        <div className="relative z-10 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              isDragOver
                ? "border-[#57cc99] bg-[#57cc99]/10"
                : "border-[#23232b] bg-[#0f0f12] hover:border-[#57cc99]/50"
            }`}
            onClick={() => document.getElementById("resume-file-input")?.click()}
          >
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.txt,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#57cc99]/20 text-[#57cc99] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-bold text-white truncate max-w-[200px]">
                    {file.name}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {(file.size / 1024).toFixed(1)} KB • Click or drag to change
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#1e1e26] border border-[#23232b] flex items-center justify-center mx-auto text-[#57cc99]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-zinc-200">
                  Click to browse or drag & drop resume file
                </div>
                <div className="text-[11px] text-zinc-500">
                  Supports PDF, DOCX, or TXT (Up to 10MB)
                </div>
              </div>
            )}
          </div>

          {/* Progress / Status indicator */}
          {uploading && (
            <div className="p-4 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-2">
              <div className="flex items-center gap-3 text-xs font-semibold text-[#57cc99]">
                <Loader2 className="w-4 h-4 animate-spin text-[#57cc99]" />
                <span>{parsingStep}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1e1e26] overflow-hidden">
                <div className="h-full bg-[#57cc99] rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="button"
            id="btn-onboarding-upload"
            onClick={handleUploadAndParse}
            disabled={!file || uploading}
            className="w-full py-3.5 px-4 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Upload & Extract Resume Data</span>
              </>
            )}
          </button>

          {/* Trust Footer */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#57cc99]" />
            <span>Securely stored & encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
