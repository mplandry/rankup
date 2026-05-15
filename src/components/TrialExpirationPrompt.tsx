// src/components/TrialExpirationPrompt.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at, trial_extended_days")
        .eq("id", session.user.id)
        .single();

      if (!profile) return;

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
      trialEndsAt.setDate(trialEndsAt.getDate() + extendedDays);

      const now = new Date();
      const daysRemaining = Math.ceil(
        (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const trialStatus = {
        expired: daysRemaining <= 0,
        daysRemaining: Math.max(0, daysRemaining),
        subscriptionStatus: profile.subscription_status,
      };

      setStatus(trialStatus);

      if (
        trialStatus.expired ||
        (trialStatus.daysRemaining <= 7 && trialStatus.daysRemaining > 0)
      ) {
        setShow(true);
      }
    } catch (error) {
      console.error("Error checking trial status:", error);
    }
  };

  if (!show || !status || status.subscriptionStatus === "active") return null;

  if (status.expired) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 40,
            maxWidth: 500,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: "#fee2e2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                margin: "0 auto 16px",
              }}
            >
              ⏰
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1B2A4A",
                marginBottom: 8,
              }}
            >
              Your trial has expired
            </h2>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              You're now limited to 10 questions per day
            </p>
          </div>

          <div
            style={{
              background: "#f8fafc",
              borderRadius: 10,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
              <strong>Subscribe to unlock:</strong>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              <div>✓ Unlimited study mode</div>
              <div>✓ 90-question exam simulations</div>
              <div>✓ Weak area analysis</div>
              <div>✓ Performance tracking</div>
            </div>
          </div>

          <button
            onClick={() => router.push("/pricing")}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--red)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            View Pricing Plans
          </button>

          <button
            onClick={() => setShow(false)}
            style={{
              width: "100%",
              padding: "10px",
              background: "transparent",
              border: "1px solid #e0e6ed",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            Continue with limited access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        border: "1px solid #fcd34d",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#92400e",
            marginBottom: 4,
          }}
        >
          ⏰ {status.daysRemaining}{" "}
          {status.daysRemaining === 1 ? "day" : "days"} left in your trial
        </div>
        <div style={{ fontSize: 13, color: "#78350f" }}>
          Subscribe now to keep unlimited access through exam day
        </div>
      </div>
      <button
        onClick={() => router.push("/pricing")}
        style={{
          padding: "10px 20px",
          background: "#f59e0b",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        View Plans
      </button>
      <button
        onClick={() => setShow(false)}
        style={{
          padding: 8,
          background: "transparent",
          border: "none",
          color: "#92400e",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ✕
      </button>
    </div>
  );
}
