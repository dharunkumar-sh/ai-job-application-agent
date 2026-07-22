"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  SlidersHorizontal,
  Bookmark,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
  Briefcase,
  ChevronDown,
  Check,
} from "lucide-react";

import { JobsWelcomeBanner } from "@/components/dashboard/jobs/JobsWelcomeBanner";
import {
  PlatformSelector,
  JobPlatform,
} from "@/components/dashboard/jobs/PlatformSelector";
import {
  JobCard,
  JobRecord,
} from "@/components/dashboard/jobs/JobCard";
import {
  ProfileCompletenessCard,
  ProfileCompletenessData,
} from "@/components/dashboard/jobs/ProfileCompletenessCard";
import {
  RecentActivityCard,
  ActivityItem,
} from "@/components/dashboard/jobs/RecentActivityCard";
import { JobsSkeleton } from "@/components/dashboard/jobs/JobsSkeleton";
import { ApplyDialog } from "@/components/dashboard/jobs/ApplyDialog";

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isCached, setIsCached] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  // Apply Modal state
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedApplyJob, setSelectedApplyJob] = useState<JobRecord | null>(null);

  // Platform selection state
  const [selectedPlatforms, setSelectedPlatforms] = useState<JobPlatform[]>([
    "Greenhouse",
    "Lever",
    "Workable",
    "Wellfound",
  ]);

  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"match" | "newest">("match");
  const [onlySaved, setOnlySaved] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // User Profile state for banner & completeness widget
  const [userName, setUserName] = useState("Candidate");
  const [userHeadline, setUserHeadline] = useState("AI Developer / Full Stack Engineer");
  const [userLocation, setUserLocation] = useState("Remote / San Francisco");
  const [completenessData, setCompletenessData] = useState<ProfileCompletenessData>({
    hasName: true,
    hasHeadline: false,
    hasLocation: false,
    hasSkills: false,
    hasWorkExp: false,
    hasEducation: false,
  });

  // Recent Activity log
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadCandidateProfile();
    fetchJobs(false);
  }, []);

  const loadCandidateProfile = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.full_name) setUserName(profile.full_name);
        if (profile.headline) setUserHeadline(profile.headline);
        if (profile.location) setUserLocation(profile.location);
      } else {
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }
      }

      // Check Work Experience & Education tables for completeness
      const { data: work } = await supabase
        .from("work_experiences")
        .select("id")
        .eq("user_id", user.id);
      const { data: edu } = await supabase
        .from("educations")
        .select("id")
        .eq("user_id", user.id);

      setCompletenessData({
        hasName: Boolean(profile?.full_name || user.user_metadata?.full_name),
        hasHeadline: Boolean(profile?.headline),
        hasLocation: Boolean(profile?.location),
        hasSkills: Array.isArray(profile?.skills) && profile.skills.length > 0,
        hasWorkExp: Array.isArray(work) && work.length > 0,
        hasEducation: Array.isArray(edu) && edu.length > 0,
      });
    } catch (e) {
      console.warn("Could not load user profile details:", e);
    }
  };

  const fetchJobs = async (forceRefresh: boolean) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/jobs/fetch?refresh=${forceRefresh}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch jobs");
      }

      setJobs(data.jobs || []);
      setIsCached(Boolean(data.cached));
      setLastFetchedAt(data.fetchedAt || new Date().toISOString());

      // Add to Activity Log ONLY on explicit user refresh
      if (forceRefresh) {
        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          type: "fetch",
          title: "Synced Fresh Jobs",
          subtitle: data.cached ? "Loaded from cache" : "Live search query executed",
          timestamp: "Just now",
        };

        setActivities((prev) => [newActivity, ...prev.slice(0, 4)]);
      }
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setErrorMsg(err.message || "Failed to load matching jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleSave = async (jobId: string, currentSaved: boolean) => {
    try {
      const newSavedState = !currentSaved;

      // Update local state immediately
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, saved_status: newSavedState } : j))
      );

      const targetJob = jobs.find((j) => j.id === jobId);

      // Call API
      await fetch("/api/jobs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, savedStatus: newSavedState }),
      });

      // Add activity log
      if (newSavedState && targetJob) {
        const saveAct: ActivityItem = {
          id: Date.now().toString(),
          type: "save",
          title: "Saved Job Posting",
          subtitle: `${targetJob.title} at ${targetJob.company}`,
          timestamp: "Just now",
        };
        setActivities((prev) => [saveAct, ...prev.slice(0, 4)]);
      }
    } catch (err) {
      console.error("Failed to update save status:", err);
    }
  };

  const handleTogglePlatform = (platform: JobPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleSelectAllPlatforms = () => {
    if (selectedPlatforms.length === 4) {
      setSelectedPlatforms(["Greenhouse"]);
    } else {
      setSelectedPlatforms(["Greenhouse", "Lever", "Workable", "Wellfound"]);
    }
  };

  // Calculate Job Counts per Platform
  const platformCounts = useMemo(() => {
    const counts: Record<JobPlatform, number> = {
      Greenhouse: 0,
      Lever: 0,
      Workable: 0,
      Wellfound: 0,
    };

    jobs.forEach((job) => {
      const platformKey = job.platform as JobPlatform;
      if (counts[platformKey] !== undefined) {
        counts[platformKey]++;
      }
    });

    return counts;
  }, [jobs]);

  // Filtered & Sorted Jobs Feed
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Platform filter
        if (!selectedPlatforms.includes(job.platform as JobPlatform)) {
          return false;
        }

        // Saved status filter
        if (onlySaved && !job.saved_status) {
          return false;
        }

        // Search term filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const titleMatch = job.title.toLowerCase().includes(term);
          const companyMatch = job.company.toLowerCase().includes(term);
          const locationMatch = job.location?.toLowerCase().includes(term) || false;
          const tagsMatch = Array.isArray(job.tags)
            ? job.tags.some((t: string) => t.toLowerCase().includes(term))
            : false;

          return titleMatch || companyMatch || locationMatch || tagsMatch;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "match") {
          return b.match_score - a.match_score;
        }
        if (sortBy === "newest") {
          const timeA = new Date(a.created_at || a.fetched_at || 0).getTime();
          const timeB = new Date(b.created_at || b.fetched_at || 0).getTime();
          return timeB - timeA;
        }
        return 0;
      });
  }, [jobs, selectedPlatforms, onlySaved, searchTerm, sortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. Welcome Banner */}
      <JobsWelcomeBanner
        userName={userName}
        userHeadline={userHeadline}
        userLocation={userLocation}
        lastFetchedAt={lastFetchedAt}
        isCached={isCached}
        isRefreshing={refreshing}
        onRefresh={() => fetchJobs(true)}
      />

      {/* 2. Selectable Platform Cards */}
      <PlatformSelector
        selectedPlatforms={selectedPlatforms}
        platformCounts={platformCounts}
        onTogglePlatform={handleTogglePlatform}
        onSelectAll={handleSelectAllPlatforms}
      />

      {/* 3. Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#16161b] border border-[#23232b] p-4 rounded-2xl shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job title, company, or tech stack (e.g. React, Vercel)..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#57cc99]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Filter Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Saved Jobs Toggle Pill */}
          <button
            type="button"
            onClick={() => setOnlySaved(!onlySaved)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              onlySaved
                ? "bg-[#57cc99]/10 border-[#57cc99] text-[#57cc99]"
                : "bg-[#0f0f12] border-[#23232b] text-zinc-400 hover:text-white"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? "fill-[#57cc99]" : ""}`} />
            <span>Saved Jobs</span>
          </button>

          {/* Custom Modern Sort By Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none ${
                sortDropdownOpen
                  ? "bg-[#16161b] border-[#57cc99] text-white shadow-lg shadow-[#57cc99]/10"
                  : "bg-[#0f0f12] border-[#23232b] text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#57cc99]" />
              <span>{sortBy === "match" ? "Highest Match %" : "Newest First"}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${sortDropdownOpen ? "rotate-180 text-[#57cc99]" : ""}`} />
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#16161b] border border-[#23232b] rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("match");
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    sortBy === "match"
                      ? "bg-[#57cc99]/15 text-[#57cc99]"
                      : "text-zinc-300 hover:bg-[#23232b]/60 hover:text-white"
                  }`}
                >
                  <span>Highest Match %</span>
                  {sortBy === "match" && <Check className="w-3.5 h-3.5 text-[#57cc99]" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy("newest");
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    sortBy === "newest"
                      ? "bg-[#57cc99]/15 text-[#57cc99]"
                      : "text-zinc-300 hover:bg-[#23232b]/60 hover:text-white"
                  }`}
                >
                  <span>Newest First</span>
                  {sortBy === "newest" && <Check className="w-3.5 h-3.5 text-[#57cc99]" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton View */}
      {loading ? (
        <JobsSkeleton />
      ) : errorMsg ? (
        /* Error State */
        <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Unable to Fetch Jobs</h3>
            <p className="text-xs text-rose-300 mt-1">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchJobs(true)}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Search</span>
          </button>
        </div>
      ) : (
        /* 4. Main Feed Grid with Right Sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Top Job Matches Feed (2 Columns on Desktop) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Feed Counter */}
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#57cc99]" />
                <span>
                  Showing {filteredJobs.length} Matched {filteredJobs.length === 1 ? "Job" : "Jobs"}
                </span>
              </div>
              {onlySaved && (
                <span className="text-xs text-[#57cc99] font-medium">
                  Filtering by Saved Status
                </span>
              )}
            </div>

            {/* Empty State */}
            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center bg-[#16161b] border border-[#23232b] rounded-3xl space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-[#57cc99] flex items-center justify-center mx-auto">
                  <Briefcase className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">No Jobs Found</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    {onlySaved
                      ? "You haven't saved any jobs yet. Click the save icon on a job card to bookmark it."
                      : "No jobs match your active search terms or selected platform filters."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setOnlySaved(false);
                    setSelectedPlatforms(["Greenhouse", "Lever", "Workable", "Wellfound"]);
                  }}
                  className="px-4 py-2 bg-[#57cc99] text-[#0f0f12] text-xs font-bold rounded-xl transition-all cursor-pointer hover:bg-[#46b887]"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Job Feed List */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((job, idx) => (
                  <JobCard
                    key={job.id || `${job.platform}-${job.company}-${job.title}-${idx}`}
                    job={job}
                    onToggleSave={handleToggleSave}
                    onApply={(targetJob) => {
                      setSelectedApplyJob(targetJob);
                      setApplyDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Profile Completeness & Recent Activity */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <ProfileCompletenessCard data={completenessData} />
            <RecentActivityCard activities={activities} />
          </div>
        </div>
      )}

      {/* Apply Choice & Automation Dialog */}
      <ApplyDialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        job={selectedApplyJob}
        onApplicationUpdated={() => {
          if (selectedApplyJob) {
            const applyAct: ActivityItem = {
              id: Date.now().toString(),
              type: "apply",
              title: "Submitted Application",
              subtitle: `${selectedApplyJob.title} at ${selectedApplyJob.company}`,
              timestamp: "Just now",
            };
            setActivities((prev) => [applyAct, ...prev.slice(0, 4)]);
          }
          fetchJobs(false);
        }}
      />
    </div>
  );
}
