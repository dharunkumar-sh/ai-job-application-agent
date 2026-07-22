"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function JobsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-44 rounded-3xl bg-[#16161b] border border-[#23232b] p-8 flex flex-col justify-between">
        <div className="space-y-3">
          <Skeleton className="h-5 w-48 rounded-full bg-[#23232b]" />
          <Skeleton className="h-8 w-96 rounded-xl bg-[#23232b]" />
          <Skeleton className="h-4 w-64 rounded-lg bg-[#23232b]" />
        </div>
      </div>

      {/* Platform Cards Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40 rounded bg-[#23232b]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#16161b] border border-[#23232b] p-4 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl bg-[#23232b]" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24 bg-[#23232b]" />
                  <Skeleton className="h-3 w-16 bg-[#23232b]" />
                </div>
              </div>
              <Skeleton className="h-3 w-full bg-[#23232b]" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton (Feed + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Cards Feed Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-72 rounded-2xl bg-[#23232b]" />
            <Skeleton className="h-10 w-36 rounded-2xl bg-[#23232b]" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-[#16161b] border border-[#23232b] p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl bg-[#23232b]" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32 bg-[#23232b]" />
                      <Skeleton className="h-5 w-56 bg-[#23232b]" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full bg-[#23232b]" />
                  <Skeleton className="h-4 w-3/4 bg-[#23232b]" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl bg-[#23232b]" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="h-64 rounded-3xl bg-[#16161b] border border-[#23232b] p-6 space-y-4">
            <Skeleton className="h-6 w-40 bg-[#23232b]" />
            <Skeleton className="h-3 w-full bg-[#23232b]" />
            <Skeleton className="h-12 w-full rounded-xl bg-[#23232b]" />
          </div>
          <div className="h-64 rounded-3xl bg-[#16161b] border border-[#23232b] p-6 space-y-4">
            <Skeleton className="h-6 w-36 bg-[#23232b]" />
            <Skeleton className="h-12 w-full rounded-xl bg-[#23232b]" />
            <Skeleton className="h-12 w-full rounded-xl bg-[#23232b]" />
          </div>
        </div>
      </div>
    </div>
  );
}
