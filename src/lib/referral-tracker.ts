// src/lib/referral-tracker.ts

import { createClient } from "./supabase/client";

export async function trackSessionCompletion(userId: string): Promise<void> {
  const supabase = createClient();
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", userId)
      .single();

    if (!profile?.referred_by) {
      return;
    }

    const { data: referral } = await supabase
      .from("referrals")
      .select("bonus_granted_at")
      .eq("referee_id", userId)
      .single();

    if (referral?.bonus_granted_at) {
      return;
    }

    await fetch("/api/referrals/grant-bonus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    console.log(`✅ Granted referral bonus for user ${userId}`);
  } catch (error) {
    console.error("Error tracking session completion:", error);
  }
}

export async function checkTrialStatus(userId: string): Promise<{
  expired: boolean;
  daysRemaining: number;
  subscriptionStatus: string;
}> {
  const supabase = createClient();
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at, trial_extended_days")
      .eq("id", userId)
      .single();

    if (!profile) {
      return { expired: true, daysRemaining: 0, subscriptionStatus: "expired" };
    }

    if (profile.subscription_status === "active") {
      return {
        expired: false,
        daysRemaining: 9999,
        subscriptionStatus: "active",
      };
    }

    const trialEndsAt = new Date(profile.trial_ends_at);
    const extendedDays = profile.trial_extended_days || 0;
    trialEndsAt.setDate(trialEndsAt.getDate() + extendedDays);

    const now = new Date();
    const daysRemaining = Math.ceil(
      (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      expired: daysRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
      subscriptionStatus: profile.subscription_status,
    };
  } catch (error) {
    console.error("Error checking trial status:", error);
    return { expired: false, daysRemaining: 0, subscriptionStatus: "unknown" };
  }
}
