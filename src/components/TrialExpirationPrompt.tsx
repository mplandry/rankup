// src/components/TrialExpirationPrompt.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TrialExpirationPrompt() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{
    expired: boolean;
    daysRemaining: number;
    subscriptionStatus: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const supabase = createClient();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at, trial_extended_days, role")
        .eq("id", session.user.id)
        .single();

      if (!profile) return;

      // Admins always have full access
      if (profile.role === "admin") return;

      if (profile.subscription_status === "active") {
        setStatus({
          expired: false,
          daysRemaining: 9999,
          subscriptionStatus: "active",
        });
        return;
      }

      const trialEndsAt = new Date(profile.trial_ends_at);
      const extendedDays = profile.trial_extended_days || 0;
      const effectiveEndDate = new Date(trialEndsAt);
      effectiveEndDate.setDate(effectiveEndDate.getDate() + extendedDays);

      const now = new Date();
      const daysRemaining = Math.ceil(
        (effectiveEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const isExpired = daysRemaining <= 0;

      setStatus({
        expired: isExpired,
        daysRemaining: Math.max(0, daysRemaining),
        subscriptionStatus: profile.subscription_status,
      });

      if (isExpired || daysRemaining <= 3) {
        setShow(true);
      }
    } catch (error) {
      console.error("Error checking trial status:", error);
    }
  };

  if (!show || !status) return null;

  if (status.expired) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 shadow-lg z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <div className="font-bold text-lg">Your trial has expired</div>
              <div className="text-sm opacity-90">
                Subscribe now to continue accessing all features
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/pricing")}
            className="bg-white dark:bg-[#111827] text-red-600 dark:text-red-400 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 px-6 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-3xl">⏰</div>
          <div>
            <div className="font-bold text-lg">
              {status.daysRemaining} day
              {status.daysRemaining !== 1 ? "s" : ""} remaining in your trial
            </div>
            <div className="text-sm opacity-90">
              Subscribe now to keep your progress and continue studying
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShow(false)}
            className="text-white hover:text-gray-200 dark:hover:text-gray-700 px-4 py-2"
          >
            Dismiss
          </button>
          <button
            onClick={() => router.push("/pricing")}
            className="bg-white dark:bg-[#111827] text-orange-600 dark:text-orange-400 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}
