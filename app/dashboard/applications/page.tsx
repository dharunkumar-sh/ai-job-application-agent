"use client";

import { useEffect, useState } from "react";
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

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");

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
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          jobs (
            title,
            company,
            company_logo,
            location,
            salary,
            job_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setApplications(data as ApplicationRecord[]);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "submitted") return app.status === "Submitted";
    if (activeTab === "missing") return app.status === "Missing Profile Info";
    if (activeTab === "manual") return app.status === "Manual Apply";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Submitted":
        return {
          bg: "bg-[#57cc99]/10",
          text: "text-[#57cc99]",
          border: "border-[#57cc99]/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "Missing Profile Info":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/30",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case "Auto-Filling":
      case "Detecting Fields":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          border: "border-blue-500/30",
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        };
      case "Manual Apply":
      default:
        return {
          bg: "bg-purple-500/10",
          text: "text-purple-400",
          border: "border-purple-500/30",
          icon: <ExternalLink className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16161b] border border-[#23232b] p-6 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-2">
            <Bot className="w-3.5 h-3.5" />
            <span>AI Application Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Application Status Tracker
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track automated Browserbase submissions, field detection audits, and manual applies.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchApplications}
          disabled={loading}
          className="px-5 py-3 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-200 hover:text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-[#57cc99] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#23232b] pb-3 overflow-x-auto">
        {[
          { id: "all", label: `All Applications (${applications.length})` },
          {
            id: "submitted",
            label: `Submitted (${applications.filter((a) => a.status === "Submitted").length})`,
          },
          {
            id: "missing",
            label: `Action Required (${applications.filter((a) => a.status === "Missing Profile Info").length})`,
          },
          {
            id: "manual",
            label: `Manual (${applications.filter((a) => a.status === "Manual Apply").length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#57cc99] text-[#0f0f12] shadow-md shadow-[#57cc99]/20"
                : "bg-[#16161b] text-zinc-400 border border-[#23232b] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#57cc99] animate-spin mb-3" />
          <p className="text-xs text-zinc-400 font-medium">Loading application pipeline...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="p-12 text-center bg-[#16161b] border border-[#23232b] rounded-3xl space-y-3">
          <FileText className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Applications Found</h3>
          <p className="text-xs text-zinc-400">
            No application records match the selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const badge = getStatusBadge(app.status);
            const jobTitle = app.jobs?.title || "Job Application";
            const companyName = app.jobs?.company || app.platform || "Company";

            return (
              <div
                key={app.id}
                className="bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/30 rounded-3xl p-6 transition-all space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Job & Company Info */}
                  <div className="flex items-center gap-4">
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

                    <div>
                      <div className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                        <span>{companyName}</span>
                        {app.platform && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#0f0f12] border border-[#23232b] text-zinc-300 flex items-center gap-1.5">
                            <img
                              src={`/${app.platform.toLowerCase()}.png`}
                              alt={app.platform}
                              className="w-3 h-3 object-contain"
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                            />
                            <span>{app.platform}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{jobTitle}</h3>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.icon}
                      <span>{app.status}</span>
                    </span>
                  </div>
                </div>

                {/* Missing Fields Highlight Section */}
                {app.status === "Missing Profile Info" && Array.isArray(app.missing_fields) && app.missing_fields.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Missing Required Fields:</span>
                      </div>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        {app.missing_fields.join(", ")}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/profile?missing=${encodeURIComponent(app.missing_fields.join(","))}`}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#0f0f12] font-extrabold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>Complete Fields</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* Footer details: Browserbase Session ID & Timestamp */}
                <div className="pt-3 border-t border-[#23232b] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400">
                  <div className="flex flex-wrap items-center gap-4">
                    {app.browserbase_session_id && (
                      <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#57cc99]" />
                        <span>Browserbase Session: <strong className="text-white">{app.browserbase_session_id}</strong></span>
                      </span>
                    )}

                    {app.browserbase_debug_url && (
                      <a
                        href={app.browserbase_debug_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>View Live Session Debug</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {app.submitted_at
                        ? `Submitted ${new Date(app.submitted_at).toLocaleDateString()}`
                        : `Logged ${new Date(app.created_at).toLocaleDateString()}`}
                    </span>
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
