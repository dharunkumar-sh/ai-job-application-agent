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

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.has_completed_onboarding) {
      setIsOpen(true);
    }
  };

  return (
    <OnboardingDialog
      isOpen={isOpen}
      onComplete={() => setIsOpen(false)}
    />
  );
}
