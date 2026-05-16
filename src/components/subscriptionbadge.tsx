// src/components/SubscriptionBadge.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

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
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "subscription_status, trial_ends_at, trial_extended_days, subscription_plan",
        )
        .eq("id", session.user.id)
        .single();

      if (profile) {
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
          trialEndsAt: effectiveEndDate.toISOString(),
          trialExtendedDays: extendedDays,
          subscriptionPlan: profile.subscription_plan,
          daysRemaining,
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
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: "#d1fae5",
          border: "1px solid #6ee7b7",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          color: "#065f46",
        }}
      >
        <span>✓</span>
        <span>
          {status.subscriptionPlan === "exam_prep"
            ? "Exam Prep Bundle"
            : status.subscriptionPlan === "monthly"
              ? "Monthly Subscriber"
              : "Full Access"}
        </span>
      </div>
    );
  }

  if (status.status === "trial" && status.daysRemaining > 0) {
    const isUrgent = status.daysRemaining <= 7;
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: isUrgent ? "#fef3c7" : "#f0f9ff",
          border: `1px solid ${isUrgent ? "#fcd34d" : "#bae6fd"}`,
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: isUrgent ? "#92400e" : "#0c4a6e",
              marginBottom: 2,
            }}
          >
            {status.daysRemaining} days left in trial
          </div>
          {status.trialExtendedDays > 0 && (
            <div style={{ fontSize: 11, color: "#64748b" }}>
              +{status.trialExtendedDays} days from referrals
            </div>
          )}
        </div>
        <button
          onClick={() => router.push("/pricing")}
          style={{
            padding: "6px 12px",
            background: isUrgent ? "#f59e0b" : "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Upgrade
        </button>
      </div>
    );
  }

  if (status.status === "expired" || status.daysRemaining <= 0) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#991b1b", marginBottom: 2 }}>
            Trial expired
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Limited to 10 questions/day
          </div>
        </div>
        <button
          onClick={() => router.push("/pricing")}
          style={{
            padding: "6px 12px",
            background: "var(--red)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Subscribe
        </button>
      </div>
    );
  }

  return null;
}
