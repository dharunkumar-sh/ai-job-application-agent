"use client";

import { useEffect, useState } from "react";
import { OnboardingDialog } from "./OnboardingDialog";
import { createClient } from "@/lib/supabase/client";

interface OnboardingWrapperProps {
  initialHasCompletedOnboarding: boolean;
}

export function OnboardingWrapper({
  initialHasCompletedOnboarding,
}: OnboardingWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [initialHasCompletedOnboarding]);

  const checkOnboardingStatus = async () => {
    // 1. If server marked onboarding as completed, do not open prompt box
    if (initialHasCompletedOnboarding) {
      setIsOpen(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsOpen(false);
      return;
    }

    try {
      // 2. Strict DB Check: If user has ANY uploaded resume in Supabase, NEVER show upload popup
      const { data: resumes, error: resumeErr } = await supabase
        .from("resumes")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (resumes && resumes.length > 0) {
        setIsOpen(false);
        return;
      }

      // 3. Check localStorage cached profile/resume
      try {
        const cached = localStorage.getItem("jobbuddy_parsed_profile");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.headline || parsed.skills?.length || parsed.summary || parsed.fullName || parsed.filename)) {
            setIsOpen(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not check cached profile:", e);
      }

      // 4. Check profile fields
      const { data: profile } = await supabase
        .from("profiles")
        .select("has_completed_onboarding, headline, summary, skills, full_name")
        .eq("id", user.id)
        .single();

      const hasProfileData = Boolean(
        profile &&
          (profile.has_completed_onboarding ||
            profile.headline ||
            profile.summary ||
            (Array.isArray(profile.skills) && profile.skills.length > 0) ||
            profile.full_name)
      );

      if (hasProfileData) {
        setIsOpen(false);
        return;
      }

      // 5. Check work experience table
      const { data: work } = await supabase
        .from("work_experiences")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (work && work.length > 0) {
        setIsOpen(false);
        return;
      }

      // Only show prompt box if neither resume nor profile information is available
      setIsOpen(true);
    } catch (err) {
      console.warn("Error checking onboarding status:", err);
      setIsOpen(false);
    }
  };

  return (
    <OnboardingDialog
      isOpen={isOpen}
      onComplete={() => setIsOpen(false)}
    />
  );
}
