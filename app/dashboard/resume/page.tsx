"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  UploadCloud,
  Download,
  Eye,
  Trash2,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle
} from "lucide-react";

interface ResumeRecord {
  id: string;
  filename: string;
  file_path: string;
  file_url: string;
  created_at: string;
  parsed_data: any;
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ResumeRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setResumes(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload resume.");
      }

      setSuccessMsg("Resume uploaded and parsed successfully!");
      fetchResumes();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (id: string, filePath: string) => {
    const supabase = createClient();
    try {
      await supabase.from("resumes").delete().eq("id", id);
      if (filePath) {
        await supabase.storage.from("resumes").remove([filePath]);
      }
      setResumes(resumes.filter((r) => r.id !== id));
      if (selectedResume?.id === id) {
        setSelectedResume(null);
      }
    } catch (err) {
      console.error("Failed to delete resume:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16161b] border border-[#23232b] p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Document Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Uploaded Resumes & Files
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your uploaded resume versions and preview parsed AI details.
          </p>
        </div>

        <div>
          <input
            type="file"
            id="resume-page-upload"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => document.getElementById("resume-page-upload")?.click()}
            disabled={uploading}
            className="px-6 py-3.5 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing Resume...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Upload New Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#57cc99] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Resume List View */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#57cc99] animate-spin mb-3" />
          <p className="text-xs text-zinc-400 font-medium">Fetching resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="border-2 border-dashed border-[#23232b] bg-[#16161b]/50 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1e26] border border-[#23232b] flex items-center justify-center mx-auto text-[#57cc99]">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Resumes Uploaded Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Upload your resume to enable AI profile auto-filling, match score calculations, and ATS resume tailoring.
          </p>
          <button
            type="button"
            onClick={() => document.getElementById("resume-page-upload")?.click()}
            className="px-5 py-2.5 bg-[#57cc99] text-[#0f0f12] font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Resume List Column */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Resume Versions ({resumes.length})
            </h2>

            <div className="space-y-3">
              {resumes.map((item) => {
                const isSelected = selectedResume?.id === item.id;
                const formattedDate = new Date(item.created_at).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-3xl border transition-all ${
                      isSelected
                        ? "bg-[#16161b] border-[#57cc99] shadow-xl"
                        : "bg-[#16161b] border-[#23232b] hover:border-[#57cc99]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 overflow-hidden">
                        <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] shrink-0 mt-0.5">
                          <FileText className="w-6 h-6" />
                        </div>

                        <div className="overflow-hidden">
                          <h3 className="text-sm font-bold text-white truncate">
                            {item.filename}
                          </h3>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {formattedDate}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#0f0f12] border border-[#23232b] text-[#57cc99] font-mono text-[10px]">
                              Parsed
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedResume(item)}
                          className="p-2 rounded-xl bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-300 hover:text-white transition-all cursor-pointer"
                          title="Preview Parsed Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-300 hover:text-[#57cc99] transition-all"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteResume(item.id, item.file_path)}
                          className="p-2 rounded-xl bg-[#0f0f12] hover:bg-rose-500/10 border border-[#23232b] text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete Resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parsed Data Preview Panel */}
          <div className="lg:col-span-5 bg-[#16161b] border border-[#23232b] rounded-3xl p-6 shadow-xl h-fit">
            <h2 className="text-sm font-bold text-white pb-4 border-b border-[#23232b] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#57cc99]" />
              <span>Parsed Resume Preview</span>
            </h2>

            {selectedResume ? (
              <div className="space-y-4 pt-4 text-xs text-zinc-300">
                <div className="p-3 rounded-2xl bg-[#0f0f12] border border-[#23232b]">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Candidate Name
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedResume.parsed_data?.fullName || "Candidate"}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0f0f12] border border-[#23232b]">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Target Headline
                  </div>
                  <div className="text-xs font-semibold text-[#57cc99] mt-0.5">
                    {selectedResume.parsed_data?.headline || "Software Professional"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                    Extracted Skills ({selectedResume.parsed_data?.skills?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResume.parsed_data?.skills?.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-lg bg-[#0f0f12] border border-[#23232b] text-[11px] font-medium text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                    Work Experiences
                  </div>
                  <div className="space-y-2">
                    {selectedResume.parsed_data?.workExperiences?.map(
                      (w: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#0f0f12] border border-[#23232b]"
                        >
                          <div className="font-bold text-white text-xs">
                            {w.title} @ {w.company}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {w.duration}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p>Click on any resume from the list to preview extracted AI details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
