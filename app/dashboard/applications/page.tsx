"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Clock,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Bot,
  RefreshCw,
  Building2,
  MapPin,
  Globe,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Search,
  Layers,
  Sparkles,
  XCircle,
  Trash2,
} from "lucide-react";

interface ApplicationRecord {
  id: string;
  job_id?: string;
  platform?: string;
  status: string;
  detected_fields?: any;
  missing_fields?: string[];
  browserbase_session_id?: string;
  browserbase_debug_url?: string;
  notes?: string;
  submitted_at?: string;
  created_at: string;
  jobs?: {
    title: string;
    company: string;
    company_logo?: string;
    location?: string;
    salary?: string;
    job_url?: string;
  };
}

function parseJobFromNotes(app: ApplicationRecord) {
  let company = app.platform || "General ATS";
  let title = "Job Application";

  if (app.notes) {
    if (app.notes.includes(" at ")) {
      const parts = app.notes.split(" at ");
      title = parts[0].replace("Saved Job Posting", "").trim() || title;
      company = parts[1].trim() || company;
    } else if (app.notes.includes("Platform: ")) {
      const pMatch = app.notes.match(/Platform:\s*([^-\n]+)/);
      if (pMatch && pMatch[1]) company = pMatch[1].trim();
    }
  }

  return {
    title,
    company,
    company_logo: "",
    location: "Remote",
    salary: "",
    job_url: "#",
  };
}

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch raw applications for user (Guaranteed to succeed, independent of FK relationship cache)
      const { data: rawApps, error: appsErr } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (appsErr) {
        console.error("Error fetching raw applications:", appsErr);
        setApplications([]);
        return;
      }

      if (!rawApps || rawApps.length === 0) {
        setApplications([]);
        return;
      }

      // 2. Extract unique non-null job_ids
      const jobIds = Array.from(
        new Set(rawApps.map((a) => a.job_id).filter(Boolean))
      );

      // 3. Fetch matching job details
      const jobsMap = new Map<string, any>();
      if (jobIds.length > 0) {
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("id, title, company, company_logo, location, salary, job_url")
          .in("id", jobIds);

        if (jobsData) {
          jobsData.forEach((j) => jobsMap.set(j.id, j));
        }
      }

      // 4. Merge applications with matching job details or parse fallback
      const merged: ApplicationRecord[] = rawApps.map((app) => {
        const job = app.job_id ? jobsMap.get(app.job_id) : null;
        return {
          ...app,
          jobs: job || parseJobFromNotes(app),
        };
      });

      setApplications(merged);
    } catch (err) {
      console.error("Error in fetchApplications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    try {
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));

      await fetch("/api/applications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
    } catch (e) {
      console.error("Failed to delete application:", e);
      fetchApplications();
    }
  };

  const handleClearAllApplications = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all application records from history?"
      )
    )
      return;

    try {
      setApplications([]);

      await fetch("/api/applications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });
    } catch (e) {
      console.error("Failed to clear all applications:", e);
      fetchApplications();
    }
  };

  // Metrics summary calculations
  const stats = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter((a) => a.status === "Submitted").length;
    const missing = applications.filter((a) => a.status === "Missing Profile Info").length;
    const manual = applications.filter((a) => a.status === "Manual Apply").length;
    const processing = applications.filter(
      (a) => a.status === "Auto-Filling" || a.status === "Detecting Fields"
    ).length;
    return { total, submitted, missing, manual, processing };
  }, [applications]);

  // Filtered applications list based on tab & search term
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (activeTab === "submitted" && app.status !== "Submitted") return false;
      if (activeTab === "missing" && app.status !== "Missing Profile Info") return false;
      if (activeTab === "manual" && app.status !== "Manual Apply") return false;
      if (
        activeTab === "processing" &&
        app.status !== "Auto-Filling" &&
        app.status !== "Detecting Fields"
      )
        return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const title = (app.jobs?.title || "").toLowerCase();
        const company = (app.jobs?.company || "").toLowerCase();
        const platform = (app.platform || "").toLowerCase();
        const status = (app.status || "").toLowerCase();
        return (
          title.includes(query) ||
          company.includes(query) ||
          platform.includes(query) ||
          status.includes(query)
        );
      }

      return true;
    });
  }, [applications, activeTab, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Submitted":
        return {
          bg: "bg-[#57cc99]/10",
          text: "text-[#57cc99]",
          border: "border-[#57cc99]/30",
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: "Submitted",
        };
      case "Missing Profile Info":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/30",
          icon: <AlertTriangle className="w-4 h-4" />,
          label: "Action Required",
        };
      case "Auto-Filling":
      case "Detecting Fields":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          border: "border-blue-500/30",
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          label: status,
        };
      case "Failed":
        return {
          bg: "bg-rose-500/10",
          text: "text-rose-400",
          border: "border-rose-500/30",
          icon: <XCircle className="w-4 h-4" />,
          label: "Failed",
        };
      case "Manual Apply":
      default:
        return {
          bg: "bg-purple-500/10",
          text: "text-purple-400",
          border: "border-purple-500/30",
          icon: <ExternalLink className="w-4 h-4" />,
          label: "Manual Apply",
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16161b] border border-[#23232b] p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-2">
            <Bot className="w-3.5 h-3.5" />
            <span>AI Automation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Application Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Monitor real-time JobBuddy AI agent applications, status audits, and manual job logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleClearAllApplications}
            disabled={loading || applications.length === 0}
            className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-40"
            title="Clear all application records from history"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>

          <button
            type="button"
            onClick={fetchApplications}
            disabled={loading}
            className="px-5 py-3.5 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-200 hover:text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-[#57cc99] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Pipeline</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-[#16161b] border border-[#23232b] rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Total Applications</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
        </div>

        {/* Submitted */}
        <div className="bg-[#16161b] border border-[#23232b] rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Submitted by AI</span>
            <div className="w-8 h-8 rounded-xl bg-[#57cc99]/10 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#57cc99]">{stats.submitted}</div>
        </div>

        {/* Action Required */}
        <div className="bg-[#16161b] border border-[#23232b] rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Action Required</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.missing}</div>
        </div>

        {/* Manual Apply */}
        <div className="bg-[#16161b] border border-[#23232b] rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Manual Applications</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400">{stats.manual}</div>
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { id: "all", label: `All (${stats.total})` },
            { id: "submitted", label: `Submitted (${stats.submitted})` },
            { id: "missing", label: `Action Required (${stats.missing})` },
            { id: "manual", label: `Manual (${stats.manual})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-[#57cc99] text-[#0f0f12] shadow-md shadow-[#57cc99]/20"
                  : "bg-[#16161b] text-zinc-400 border border-[#23232b] hover:text-white hover:border-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, title, or platform..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] transition-all"
          />
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#57cc99] animate-spin mb-3" />
          <p className="text-xs text-zinc-400 font-medium">Loading application pipeline...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="p-12 text-center bg-[#16161b] border border-[#23232b] rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0f0f12] border border-[#23232b] flex items-center justify-center mx-auto text-zinc-500">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Applications Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No application records match your current filter or search criteria.
            </p>
          </div>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#57cc99] text-[#0f0f12] font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Find & Apply to Jobs</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const badge = getStatusBadge(app.status);
            const jobTitle = app.jobs?.title || "Job Application";
            const companyName = app.jobs?.company || app.platform || "Company";
            const jobUrl = app.jobs?.job_url;

            return (
              <div
                key={app.id}
                className="bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/30 rounded-3xl p-6 transition-all space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Job & Company Info */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#0f0f12] border border-[#23232b] p-1.5 flex items-center justify-center shrink-0">
                      {app.jobs?.company_logo ? (
                        <img
                          src={app.jobs.company_logo}
                          alt={companyName}
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-[#57cc99]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-400 flex items-center gap-2 truncate">
                        <span className="truncate">{companyName}</span>
                        {app.platform && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#0f0f12] border border-[#23232b] text-zinc-300 flex items-center gap-1.5 shrink-0">
                            <img
                              src={`/${app.platform.toLowerCase()}.png`}
                              alt={app.platform}
                              className="w-3 h-3 object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <span>{app.platform}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5 truncate">
                        {jobTitle}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border flex items-center gap-1.5 shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Missing Fields Highlight Section */}
                {app.status === "Missing Profile Info" &&
                  Array.isArray(app.missing_fields) &&
                  app.missing_fields.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Required Missing Fields:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {app.missing_fields.map((f, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[11px] font-semibold text-amber-200"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/profile?missing=${encodeURIComponent(
                          app.missing_fields.join(",")
                        )}`}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#0f0f12] font-extrabold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <span>Fix Profile Fields</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                {/* Footer details: Browserbase Session ID, Debug Replay & Timestamp */}
                <div className="pt-3.5 border-t border-[#23232b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
                  <div className="flex flex-wrap items-center gap-4">
                    {app.browserbase_session_id && (
                      <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#57cc99]" />
                        <span>
                          Browserbase Session:{" "}
                          <strong className="text-white">
                            {app.browserbase_session_id}
                          </strong>
                        </span>
                      </span>
                    )}

                    {app.browserbase_debug_url && (
                      <a
                        href={app.browserbase_debug_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>View Live Session Replay</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {app.submitted_at
                          ? `Submitted ${new Date(app.submitted_at).toLocaleDateString()}`
                          : `Logged ${new Date(app.created_at).toLocaleDateString()}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {jobUrl && (
                        <a
                          href={jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-300 hover:text-white text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Job Posting</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteApplication(app.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-[11px] font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                        title="Clear application record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

