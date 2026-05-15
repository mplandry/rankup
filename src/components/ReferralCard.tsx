// src/components/ReferralCard.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ReferralStats {
  referralCode: string;
  shareUrl: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalBonusDays: number;
  totalBonusWeeks: number;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    signedUpAt: string;
    bonusGranted: boolean;
    completedFirstSession: boolean;
  }>;
}

export default function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralStats();
  }, []);

  const loadReferralStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/referrals/stats?userId=${session.user.id}`);
      const data = await res.json();

      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaText = () => {
    if (!stats) return;
    const message = `Join me on RankUp to prep for the MA fire promotional exam! You'll get +2 weeks trial: ${stats.shareUrl}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  if (loading) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e6ed",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 14, color: "#64748b" }}>
          Loading referral stats...
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e6ed",
        borderRadius: 12,
        padding: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: "#fef3c7",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          🤝
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1B2A4A" }}>
            Invite Firefighters
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Give them +2 weeks, get +2 weeks
          </div>
        </div>
      </div>

      {/* Share URL */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 6,
          }}
        >
          Your referral link
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type='text'
            value={stats.shareUrl}
            readOnly
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #e0e6ed",
              borderRadius: 8,
              fontSize: 13,
              background: "#f8fafc",
              fontFamily: "monospace",
              color: "#475569",
            }}
          />
          <button
            onClick={copyLink}
            style={{
              padding: "10px 20px",
              background: copied ? "#10b981" : "#1B2A4A",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "✓ Copied" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Share via Text button */}
      <button
        onClick={shareViaText}
        style={{
          width: "100%",
          padding: "10px",
          background: "#fff",
          border: "1px solid #e0e6ed",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          color: "#475569",
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        📱 Share via Text Message
      </button>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1B2A4A" }}>
            {stats.totalReferrals}
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            firefighters joined
          </div>
        </div>
        <div style={{ background: "#fef3c7", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#d97706" }}>
            +{stats.totalBonusWeeks}
          </div>
          <div style={{ fontSize: 11, color: "#92400e" }}>weeks earned</div>
        </div>
      </div>

      {/* Pending vs Completed */}
      {stats.totalReferrals > 0 && (
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            background: "#f8fafc",
            borderRadius: 8,
            padding: 10,
          }}
        >
          ✓ <strong>{stats.completedReferrals}</strong> completed first session
          • ⏱️ <strong>{stats.pendingReferrals}</strong> pending
        </div>
      )}

      {/* Referral list */}
      {stats.referrals && stats.referrals.length > 0 && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid #e0e6ed",
            paddingTop: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
            }}
          >
            Recent referrals
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.referrals.slice(0, 5).map((ref) => (
              <div
                key={ref.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 8,
                  background: "#f8fafc",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#1B2A4A" }}>
                    {ref.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {new Date(ref.signedUpAt).toLocaleDateString()}
                  </div>
                </div>
                {ref.bonusGranted ? (
                  <span
                    style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}
                  >
                    ✓ Bonus granted
                  </span>
                ) : (
                  <span
                    style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}
                  >
                    ⏱️ Pending
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
