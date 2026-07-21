import Link from "next/link";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import {
  ArrowRight,
  Sparkles,
  User,
  LayoutDashboard,
  FileText,
  Briefcase,
  TrendingUp,
  Zap,
  Database,
  Bot,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Target,
  ShieldCheck
} from "lucide-react";

export const metadata: Metadata = {
  title: "JobBuddy AI — Smart AI Job Search Assistant & Resume Workspace",
  description:
    "Land your next role 10x faster with JobBuddy AI. ATS resume tailoring, intelligent match scores, and automated application tracking pipeline.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#0f0f12] text-zinc-100 relative overflow-hidden flex flex-col justify-between selection:bg-[#57cc99] selection:text-[#0f0f12]">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#57cc99]/15 via-[#57cc99]/5 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#57cc99]/5 blur-[160px] rounded-full pointer-events-none" />

      {/* HEADER SECTION - Glassmorphism Navbar with Smooth Scroll Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#23232b] bg-[#0f0f12]/80 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Logo size="md" href="/" />

          {/* Smooth Scroll Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-[#16161b]/90 border border-[#23232b] p-1.5 rounded-full shadow-inner text-xs font-semibold text-zinc-400" aria-label="Main Smooth Navigation">
            <a
              href="#hero"
              id="nav-overview"
              className="px-4 py-2 rounded-full hover:text-white hover:bg-[#23232b] transition-all"
            >
              Overview
            </a>
            <a
              href="#how-it-works"
              id="nav-how-it-works"
              className="px-4 py-2 rounded-full hover:text-[#57cc99] hover:bg-[#23232b] transition-all"
            >
              How It Works
            </a>
            <a
              href="#features"
              id="nav-features"
              className="px-4 py-2 rounded-full hover:text-[#57cc99] hover:bg-[#23232b] transition-all"
            >
              Features Grid
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                id="btn-nav-dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-bold text-sm transition-all shadow-lg shadow-[#57cc99]/25 active:scale-[0.98]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  id="btn-nav-login"
                  className="px-4 py-2 rounded-xl text-zinc-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  id="btn-nav-signup"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-bold text-sm transition-all shadow-lg shadow-[#57cc99]/25 active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section id="hero" className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#16161b] border border-[#23232b] text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner">
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Career Automation Suite</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.12] max-w-5xl">
            Supercharge Your Job Search <br />
            <span className="text-[#57cc99]">
              Driven by Artificial Intelligence
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-3xl leading-relaxed">
            Automate job tracking, generate customized resumes & cover letters tailored to every job description, and monitor interview pipelines in real time.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {user ? (
              <Link
                href="/dashboard"
                id="btn-hero-dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-base shadow-xl shadow-[#57cc99]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>Access Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  id="btn-hero-create-account"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-base shadow-xl shadow-[#57cc99]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  id="btn-hero-login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#16161b] hover:bg-[#1e1e26] border border-[#23232b] text-zinc-200 font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <User className="w-5 h-5 text-zinc-400" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Hero Preview Card */}
          <div className="mt-16 w-full max-w-4xl bg-[#16161b] border border-[#23232b] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-[#23232b]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-[#57cc99]" />
                <span className="ml-2 text-xs font-mono text-zinc-500">jobbuddy.ai</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#57cc99]/10 text-[#57cc99] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Matching Engine</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="p-4 rounded-2xl bg-[#0f0f12] border border-[#23232b]">
                <div className="text-xs text-zinc-500 font-medium">Senior Frontend Engineer</div>
                <div className="text-sm font-bold text-white mt-1">Google — Mountain View, CA</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Match Score</span>
                  <span className="text-xs font-extrabold text-[#57cc99] px-2 py-0.5 rounded bg-[#57cc99]/15">96%</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0f0f12] border border-[#23232b]">
                <div className="text-xs text-zinc-500 font-medium">Full Stack AI Developer</div>
                <div className="text-sm font-bold text-white mt-1">OpenAI — San Francisco, CA</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Match Score</span>
                  <span className="text-xs font-extrabold text-[#57cc99] px-2 py-0.5 rounded bg-[#57cc99]/15">92%</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0f0f12] border border-[#23232b]">
                <div className="text-xs text-zinc-500 font-medium">Lead UI/UX Systems</div>
                <div className="text-sm font-bold text-white mt-1">Vercel — Remote</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Match Score</span>
                  <span className="text-xs font-extrabold text-[#57cc99] px-2 py-0.5 rounded bg-[#57cc99]/15">98%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 border-t border-[#23232b]">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-4">
              <Clock className="w-3.5 h-3.5" />
              <span>Simple Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              How It Works
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-400">
              Four streamlined steps to land your target offers without manual repetitive work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-[#16161b] border border-[#23232b] p-6 rounded-3xl relative">
              <div className="text-4xl font-black text-[#57cc99]/30 mb-4 font-mono">01</div>
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Build Profile</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect your account and upload your master resume or link your portfolio details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#16161b] border border-[#23232b] p-6 rounded-3xl relative">
              <div className="text-4xl font-black text-[#57cc99]/30 mb-4 font-mono">02</div>
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Analyze Job Posts</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                AI extracts core requirements, key skills, and keyword match scores automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#16161b] border border-[#23232b] p-6 rounded-3xl relative">
              <div className="text-4xl font-black text-[#57cc99]/30 mb-4 font-mono">03</div>
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Generate Tailored Documents</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Instantly craft role-specific resumes and compelling cover letters in seconds.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#16161b] border border-[#23232b] p-6 rounded-3xl relative">
              <div className="text-4xl font-black text-[#57cc99]/30 mb-4 font-mono">04</div>
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Track & Succeed</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Monitor status pipelines, interview schedules, and response rates in real time.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES GRID CARDS SECTION */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-[#23232b]">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-4">
              <Layers className="w-3.5 h-3.5" />
              <span>Full Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Powerful Features
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-400">
              Everything you need to manage your job search efficiently in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#57cc99] transition-colors">
                AI Resume Tailoring
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Automatically align bullet points, skills, and summary sections to match ATS keywords for every job posting.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#57cc99] transition-colors">
                Smart Job Tracker
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Kanban-style tracking board for your applications: Saved, Applied, Interviewing, Offered, and Rejected.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#57cc99] transition-colors">
                Match Score Analytics
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Get instant percentage match scores highlighting skill gaps, missing qualifications, and recommendations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#57cc99] transition-colors">
                One-Click Autofill
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Extract job details directly from web pages and pre-fill application records in a single click.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#57cc99] mb-2 group-hover:text-[#57cc99] transition-colors">
                Cloud Sync Pipeline
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Your application history, resumes, and interview notes are synchronized securely across all devices.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-[#16161b] border border-[#23232b] hover:border-[#57cc99]/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-[#57cc99]/15 border border-[#57cc99]/30 flex items-center justify-center text-[#57cc99] mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#57cc99] transition-colors">
                AI Interview Prep
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Generate likely technical & behavioral interview questions tailored specifically to the position.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER SECTION */}
      <footer className="border-t border-[#23232b] bg-[#121216] relative z-10 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#23232b]">
          {/* Column 1: Brand & Tagline */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" href="/" />
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Empowering candidates to automate application workflows, tailor resumes with artificial intelligence, and land their dream roles faster.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#57cc99] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#57cc99] animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <a href="#hero" className="hover:text-[#57cc99] transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#57cc99] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#57cc99] transition-colors">
                  Features Grid
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#57cc99] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Account */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account & Access</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <Link href="/login" className="hover:text-[#57cc99] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[#57cc99] transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#57cc99] transition-colors">
                  Google SSO
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#57cc99] transition-colors">
                  Protected Session
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Security & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Security & Trust</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#57cc99]" />
                <span>Protected Sessions</span>
              </li>
              <li>
                <span className="hover:text-zinc-300 transition-colors">Privacy Standard</span>
              </li>
              <li>
                <span className="hover:text-zinc-300 transition-colors">Data Encryption</span>
              </li>
              <li>
                <span className="hover:text-zinc-300 transition-colors">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} JobBuddy AI. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-400 cursor-pointer">Privacy</span>
            <span className="hover:text-zinc-400 cursor-pointer">Terms</span>
            <span className="hover:text-zinc-400 cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
