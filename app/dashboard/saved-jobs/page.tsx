"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { JobCard, JobRecord } from "@/components/dashboard/jobs/JobCard";
import { ApplyDialog } from "@/components/dashboard/jobs/ApplyDialog";
import {
  Bookmark,
  Search,
  Sparkles,
  Loader2,
  RefreshCw,
  FileText,
  Briefcase,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function SavedJobsPage() {
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<JobRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "applied" | "unapplied">("all");

  // Apply dialog modal state
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
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
      // 1. Fetch saved jobs for user from Supabase
      const { data: jobsData, error: jobsErr } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("saved_status", true)
        .order("created_at", { ascending: false });

      if (jobsErr) {
        console.error("Error loading saved jobs:", jobsErr);
        setLoading(false);
        return;
      }

      let list: JobRecord[] = jobsData || [];

      // 2. Query user applications from Supabase to attach latest application status
      const { data: userApps } = await supabase
        .from("applications")
        .select("job_id, status")
        .eq("user_id", user.id);

      if (userApps && userApps.length > 0) {
        const appMap = new Map<string, string>();
        userApps.forEach((a) => {
          if (a.job_id) appMap.set(a.job_id, a.status);
        });

        list = list.map((j) => {
          const status = appMap.get(j.id);
          if (status) {
            return {
              ...j,
              application_status: status,
              applied_status:
                status === "Submitted" ||
                status === "Manual Apply" ||
                Boolean(j.applied_status),
            };
          }
          return j;
        });
      }

      setSavedJobs(list);
    } catch (err) {
      console.error("Failed to load saved jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (jobId: string, currentSaved: boolean) => {
    try {
      const newSavedState = !currentSaved;

      // Optimistically remove from saved list if un-saving
      if (!newSavedState) {
        setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
      }

      const targetJob = savedJobs.find((j) => j.id === jobId);

      await fetch("/api/jobs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          job: targetJob,
          savedStatus: newSavedState,
        }),
      });
    } catch (err) {
      console.error("Failed to update save status:", err);
      fetchSavedJobs(); // Refresh on error
    }
  };

  const handleApply = (job: JobRecord) => {
    setSelectedJob(job);
    setApplyDialogOpen(true);
  };

  const filteredJobs = useMemo(() => {
    return savedJobs.filter((job) => {
      // Filter by application status
      if (
        activeFilter === "applied" &&
        !job.applied_status &&
        job.application_status !== "Submitted" &&
        job.application_status !== "Manual Apply"
      ) {
        return false;
      }
      if (
        activeFilter === "unapplied" &&
        (job.applied_status ||
          job.application_status === "Submitted" ||
          job.application_status === "Manual Apply")
      ) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const title = (job.title || "").toLowerCase();
        const company = (job.company || "").toLowerCase();
        const platform = (job.platform || "").toLowerCase();
        const location = (job.location || "").toLowerCase();
        return (
          title.includes(query) ||
          company.includes(query) ||
          platform.includes(query) ||
          location.includes(query)
        );
      }

      return true;
    });
  }, [savedJobs, activeFilter, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16161b] border border-[#23232b] p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-2">
            <Bookmark className="w-3.5 h-3.5 fill-[#57cc99]" />
            <span>Bookmarked Collection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Saved Jobs
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            View your bookmarked opportunities, track live application updates, and apply with AI assistance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSavedJobs}
          disabled={loading}
          className="px-5 py-3.5 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-200 hover:text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-[#57cc99] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Controls Bar: Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { id: "all", label: `All Saved (${savedJobs.length})` },
            {
              id: "applied",
              label: `Applied (${
                savedJobs.filter(
                  (j) =>
                    j.applied_status ||
                    j.application_status === "Submitted" ||
                    j.application_status === "Manual Apply"
                ).length
              })`,
            },
            {
              id: "unapplied",
              label: `Not Applied (${
                savedJobs.filter(
                  (j) =>
                    !j.applied_status &&
                    j.application_status !== "Submitted" &&
                    j.application_status !== "Manual Apply"
                ).length
              })`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeFilter === tab.id
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
            placeholder="Search saved jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] transition-all"
          />
        </div>
      </div>

      {/* Saved Jobs Grid View */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#57cc99] animate-spin mb-3" />
          <p className="text-xs text-zinc-400 font-medium">Fetching saved jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-[#16161b] border border-[#23232b] rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0f0f12] border border-[#23232b] flex items-center justify-center mx-auto text-zinc-500">
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Saved Jobs Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {savedJobs.length === 0
                ? "Click the bookmark icon on any job card on the Jobs page to save jobs here for quick access later."
                : "No saved jobs match your current filter or search criteria."}
            </p>
          </div>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#57cc99] text-[#0f0f12] font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore Jobs</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onToggleSave={handleToggleSave}
              onApply={handleApply}
            />
          ))}
        </div>
      )}

      {/* Apply Assistant Modal */}
      <ApplyDialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        job={selectedJob}
        onApplicationUpdated={fetchSavedJobs}
      />
    </div>
  );
}
