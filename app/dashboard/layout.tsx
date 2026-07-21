import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { OnboardingWrapper } from "@/components/dashboard/OnboardingWrapper";
import { Search, Bell } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = user.user_metadata?.full_name || "User";
  const email = user.email || "";

  // Check onboarding status in DB
  let hasCompletedOnboarding = false;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", user.id)
      .single();

    if (profile && profile.has_completed_onboarding) {
      hasCompletedOnboarding = true;
    }
  } catch (err) {
    console.warn("Could not fetch profile onboarding status:", err);
  }

  return (
    <div className="flex h-screen bg-[#0f0f12] text-zinc-100 overflow-hidden selection:bg-[#57cc99] selection:text-[#0f0f12]">
      {/* Onboarding Non-Closable Dialog for First Time / Missing Resume Users */}
      <OnboardingWrapper initialHasCompletedOnboarding={hasCompletedOnboarding} />

      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-20 border-b border-[#23232b] bg-[#16161b]/80 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20">
          {/* Quick Search Input */}
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search jobs, resumes, applications..."
              className="w-full pl-10 pr-4 py-2 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] focus:ring-1 focus:ring-[#57cc99] transition-all"
            />
          </div>

          {/* User & Quick Stats Right Bar */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Status Pill */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#0f0f12] text-[#57cc99] border border-[#23232b]">
              <span className="w-2 h-2 rounded-full bg-[#57cc99] animate-pulse" />
              <span>JobBuddy Active</span>
            </div>

            {/* Notification Icon */}
            <button className="w-10 h-10 rounded-2xl bg-[#0f0f12] border border-[#23232b] flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#57cc99]/30 transition-all relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#57cc99]" />
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#23232b]">
              <div className="w-9 h-9 rounded-2xl bg-[#57cc99] flex items-center justify-center font-extrabold text-[#0f0f12] text-sm shadow-md shadow-[#57cc99]/20">
                {fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                  {fullName}
                </div>
                <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                  {email}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
