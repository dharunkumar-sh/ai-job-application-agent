"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password should be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSuccessMsg(
          "Account created successfully! Please check your email to confirm your account."
        );
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#0f0f12] text-zinc-100 selection:bg-[#57cc99] selection:text-[#0f0f12]">
      {/* LEFT SIDE: Hero Section & Artwork */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative flex-col justify-between p-12 overflow-hidden border-r border-[#23232b]">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/auth-hero.jpg"
            alt="JobBuddy AI Workspace"
            fill
            className="object-cover object-center brightness-[0.4] contrast-[1.1]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f12] via-[#0f0f12]/60 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#57cc99]/15 blur-[140px] rounded-full pointer-events-none" />
        </div>

        {/* Top Branding - Clickable to Home Route */}
        <div className="relative z-10">
          <Logo size="lg" href="/" />
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 max-w-xl my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Join JobBuddy AI Assistant</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Start Building Your <br />
            <span className="text-[#57cc99]">
              Career Superpower
            </span>
          </h1>

          <p className="mt-4 text-base text-zinc-300 leading-relaxed">
            Create an account in seconds. Access AI resume tailoring, automated status tracking, and protected cloud sync.
          </p>

          <div className="mt-8 space-y-3.5 text-sm text-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#57cc99]/20 border border-[#57cc99]/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#57cc99]" />
              </div>
              <span>Free Account with Unlimited Job Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#57cc99]/20 border border-[#57cc99]/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#57cc99]" />
              </div>
              <span>Enterprise-Grade Encryption & Supabase Auth</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#57cc99]/20 border border-[#57cc99]/40 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-[#57cc99]" />
              </div>
              <span>One-Click Google Authentication</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-zinc-400">
          © {new Date().getFullYear()} JobBuddy AI. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Auth Container */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#57cc99]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10 my-auto">
          {/* Mobile Branding - Clickable to Home Route */}
          <div className="lg:hidden text-center mb-8 flex justify-center">
            <Logo size="lg" href="/" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Get started with your AI job search workspace.
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-8 shadow-2xl shadow-black/80">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#57cc99] shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google Sign Up */}
            <button
              type="button"
              id="btn-signup-google"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
              className="w-full py-3.5 px-4 bg-[#1e1e26] hover:bg-[#252530] text-zinc-100 font-medium rounded-2xl border border-[#2e2e38] transition-all duration-200 flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#57cc99]" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
              )}
              <span>Sign up with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#23232b]"></div>
              </div>
              <span className="relative px-3 bg-[#16161b] text-xs uppercase tracking-wider text-zinc-500 font-medium">
                Or register with email
              </span>
            </div>

            {/* Email Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-signup-fullname"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-12 pr-4 py-3 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] focus:ring-1 focus:ring-[#57cc99] transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="input-signup-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] focus:ring-1 focus:ring-[#57cc99] transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="input-signup-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-12 pr-12 py-3 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] focus:ring-1 focus:ring-[#57cc99] transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="input-signup-confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-12 pr-4 py-3 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#57cc99] focus:ring-1 focus:ring-[#57cc99] transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-signup-submit"
                disabled={loading || googleLoading}
                className="w-full mt-2 py-3.5 px-4 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-bold rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#0f0f12]" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                id="link-goto-login"
                className="font-bold text-[#57cc99] hover:underline transition-all"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
