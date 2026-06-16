// src/components/SubscriptionBadge.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SubscriptionStatus {
  status: string;
  trialEndsAt: string | null;
  trialExtendedDays: number;
  subscriptionPlan: string | null;
  daysRemaining: number;
}

export default function SubscriptionBadge() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const supabase = createClient();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "subscription_status, trial_ends_at, trial_extended_days, subscription_plan, role",
        )
        .eq("id", session.user.id)
        .single();

      if (profile) {
        // Admins always have full access — show nothing
        if (profile.role === "admin") {
          setLoading(false);
          return;
        }

        const trialEndsAt = profile.trial_ends_at;
        const extendedDays = profile.trial_extended_days || 0;
        const effectiveEndDate = new Date(trialEndsAt);
        effectiveEndDate.setDate(effectiveEndDate.getDate() + extendedDays);

        const now = new Date();
        const daysRemaining = Math.ceil(
          (effectiveEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        setStatus({
          status: profile.subscription_status,
          trialEndsAt: profile.trial_ends_at,
          trialExtendedDays: extendedDays,
          subscriptionPlan: profile.subscription_plan,
          daysRemaining: Math.max(0, daysRemaining),
        });
      }
    } catch (error) {
      console.error("Error loading subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) return null;

  if (status.status === "active") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-semibold text-green-700">
          Active Subscription
        </span>
        {status.subscriptionPlan && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
            {status.subscriptionPlan === "monthly"
              ? "Monthly"
              : status.subscriptionPlan === "exam_prep"
                ? "Exam Prep"
                : "Department"}
          </span>
        )}
      </div>
    );
  }

  const isExpired = status.daysRemaining <= 0;

  if (isExpired) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-sm font-semibold text-red-700">
          Trial Expired
        </span>
        <button
          onClick={() => router.push("/pricing")}
          className="ml-2 text-xs font-semibold text-red-600 hover:text-red-700 underline"
        >
          Subscribe
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      <span className="text-sm font-semibold text-blue-700">
        Trial: {status.daysRemaining} day
        {status.daysRemaining !== 1 ? "s" : ""} left
      </span>
      {status.trialExtendedDays > 0 && (
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
          +{status.trialExtendedDays} bonus
        </span>
      )}
    </div>
  );
}
