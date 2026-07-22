"use client";

import { Activity, Clock, Bookmark, ExternalLink, RefreshCw } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "fetch" | "save" | "apply";
  title: string;
  subtitle: string;
  timestamp: string;
}

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "save":
        return <Bookmark className="w-3.5 h-3.5 text-[#57cc99]" />;
      case "apply":
        return <ExternalLink className="w-3.5 h-3.5 text-blue-400" />;
      case "fetch":
      default:
        return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23232b]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            <p className="text-[11px] text-zinc-400">Search & match timeline</p>
          </div>
        </div>
      </div>

      {/* Activity Timeline Items */}
      {activities.length === 0 ? (
        <div className="text-center py-6 text-xs text-zinc-500">
          No recent activity logged yet.
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 rounded-2xl bg-[#0f0f12] border border-[#23232b] transition-all hover:border-zinc-700"
            >
              <div className="p-2 rounded-xl bg-[#16161b] border border-[#23232b] shrink-0 mt-0.5">
                {getActivityIcon(act.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {act.title}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {act.subtitle}
                </div>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{act.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
