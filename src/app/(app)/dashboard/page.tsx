"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import ReferralCard from "@/components/ReferralCard";
import TrialExpirationPrompt from "@/components/TrialExpirationPrompt";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", session.user.id);

      const totalSessions = data?.length || 0;
      const totalQuestions =
        data?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0;
      const avgScore = data?.length
        ? Math.round(
            data.reduce((sum, s) => sum + (s.score || 0), 0) / data.length,
          )
        : 0;

      setStats({ totalSessions, totalQuestions, avgScore });
    };
    init();
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Firefighter";

  if (!user) return null;

    <div style={{ padding: "36px 40px", maxWidth: 1200 }}>
        {/* Trial Expiration Prompt */}
        <TrialExpirationPrompt />

        {/* Header with Subscription Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
              Welcome back, {userName}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Here's your study progress
            </div>
          </div>
          <SubscriptionBadge />
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            {
              label: "Study Sessions",
              value: stats?.totalSessions || 0,
              icon: "📚",
              color: "var(--red)",
            },
            {
              label: "Questions Answered",
              value: stats?.totalQuestions || 0,
              icon: "✍️",
              color: "#3b82f6",
            },
            {
              label: "Average Score",
              value: `${stats?.avgScore || 0}%`,
              icon: "📊",
              color: "#10b981",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: item.color,
                  marginBottom: 4,
                }}
              >
                {item.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Referral Card */}
        <ReferralCard />

        {/* Quick Actions */}
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Quick Actions
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <button
              onClick={() => router.push("/study")}
              style={{
                padding: "14px 20px",
                background: "var(--red)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              🔥 Start Study Session
            </button>
            <button
              onClick={() => router.push("/exam")}
              style={{
                padding: "14px 20px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              📝 Take Practice Exam
            </button>
            <button
              onClick={() => router.push("/flashcards")}
              style={{
                padding: "14px 20px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              🎯 Review Flashcards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
