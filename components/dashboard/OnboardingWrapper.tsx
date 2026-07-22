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
    // If user has not completed onboarding, trigger dialog
    if (!initialHasCompletedOnboarding) {
      setIsOpen(true);
    } else {
      checkOnboardingStatus();
    }
  }, [initialHasCompletedOnboarding]);

  const checkOnboardingStatus = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Check profile onboarding flag
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_completed_onboarding, headline, summary")
      .eq("id", user.id)
      .single();

    // Check if user has uploaded at least 1 resume
    const { data: resumes } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    const hasResume = resumes && resumes.length > 0;
    const hasProfileInfo = profile && (profile.headline || profile.summary);

    if (!profile || (!profile.has_completed_onboarding && !hasResume && !hasProfileInfo)) {
      setIsOpen(true);
    } else {
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
