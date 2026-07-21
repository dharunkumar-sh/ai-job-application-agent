"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import {
  Briefcase,
  FileText,
  User,
  Target,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap
} from "lucide-react";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    {
      name: "Jobs",
      href: "/dashboard/jobs",
      icon: Briefcase,
    },
    {
      name: "Resume",
      href: "/dashboard/resume",
      icon: FileText,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      name: "Application Status",
      href: "/dashboard/applications",
      icon: Target,
    },
  ];

  const bottomNavItems = [
    {
      name: "Billing / Credits",
      href: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      name: "Profile Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard/jobs" && pathname === "/dashboard") return true;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`relative flex flex-col justify-between h-screen bg-[#16161b] border-r border-[#23232b] transition-all duration-300 ease-in-out select-none z-30 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-7 w-7 h-7 rounded-full bg-[#1e1e26] border border-[#23232b] text-zinc-300 hover:text-[#57cc99] hover:border-[#57cc99]/40 flex items-center justify-center shadow-lg transition-all z-40 cursor-pointer"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* TOP SECTION: Branding */}
      <div>
        <div className="h-20 flex items-center px-4 border-b border-[#23232b]">
          {isCollapsed ? (
            <div className="mx-auto">
              <Logo size="md" showText={false} href="/dashboard" />
            </div>
          ) : (
            <div className="px-2 overflow-hidden">
              <Logo size="md" showText={true} href="/dashboard" />
            </div>
          )}
        </div>

        {/* MAIN NAVIGATION OPTIONS */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all group relative ${
                  active
                    ? "bg-[#57cc99] text-[#0f0f12] shadow-lg shadow-[#57cc99]/20 font-bold"
                    : "text-zinc-400 hover:text-white hover:bg-[#1e1e26]"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    active ? "text-[#0f0f12]" : "text-zinc-400 group-hover:text-[#57cc99]"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1e1e26] text-white text-xs font-semibold rounded-xl border border-[#23232b] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: Footer (Billing, Credits Display, Settings, Sign Out) */}
      <div className="p-3 border-t border-[#23232b] space-y-3">
        {/* Credits Display Section */}
        {!isCollapsed ? (
          <div className="p-3.5 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#57cc99]" />
                Credits Available
              </span>
              <span className="font-bold text-[#57cc99]">250 / 500</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#1e1e26] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#57cc99] to-[#80ed99] rounded-full transition-all duration-500"
                style={{ width: "50%" }}
              />
            </div>

            <Link
              href="/dashboard/billing"
              className="flex items-center justify-between text-[11px] font-bold text-[#57cc99] hover:underline pt-0.5"
            >
              <span>Upgrade Plan</span>
              <Zap className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#0f0f12] border border-[#23232b] text-center group relative">
            <Sparkles className="w-4 h-4 text-[#57cc99]" />
            <span className="text-[10px] font-extrabold text-[#57cc99] mt-0.5">250</span>
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1e1e26] text-white text-xs font-semibold rounded-xl border border-[#23232b] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              250 / 500 Credits Available
            </div>
          </div>
        )}

        {/* Bottom Nav Items (Billing & Profile Settings) */}
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all group relative ${
                  active
                    ? "bg-[#57cc99] text-[#0f0f12] font-bold"
                    : "text-zinc-400 hover:text-white hover:bg-[#1e1e26]"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    active ? "text-[#0f0f12]" : "text-zinc-400 group-hover:text-[#57cc99]"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1e1e26] text-white text-xs font-semibold rounded-xl border border-[#23232b] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Sign Out Action */}
          <form action="/auth/signout" method="post" className="w-full">
            <button
              type="submit"
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl font-medium text-sm text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group relative cursor-pointer ${
                isCollapsed ? "justify-center px-0" : ""
              }`}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0 text-zinc-400 group-hover:text-rose-400 transition-colors" />
              {!isCollapsed && <span>Sign Out</span>}

              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1e1e26] text-rose-400 text-xs font-semibold rounded-xl border border-[#23232b] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  Sign Out
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
