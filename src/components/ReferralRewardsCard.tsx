// src/components/ReferralRewardsCard.tsx
//
// Referrer-facing UI for the Stripe-credit referral program (replaces the
// old trial-day ReferralCard, which is now inert). Backed by
// /api/referral/stats.
"use client";

import { useEffect, useState } from "react";

interface ReferralStats {
  referralCode: string | null;
  shareUrl: string | null;
  totalReferred: number;
  pendingCents: number;
  paidOutCents: number;
  expiredCount: number;
  crewBonusCount: number;
  crewBonusProgress: { unlockedCount: number; remaining: number; milestone: number };
  referrals: Array<{
    name: string;
    planType: string;
    creditCents: number;
    status: string;
    unlocksAt: string | null;
    createdAt: string;
  }>;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  pending: {
    text: "Pending (30-day hold)",
    className: "text-gray-400 dark:text-gray-500",
  },
  unlocked: {
    text: "Paid out",
    className: "text-green-600 dark:text-green-400 font-semibold",
  },
  applied: {
    text: "Paid out",
    className: "text-green-600 dark:text-green-400 font-semibold",
  },
  expired: {
    text: "Expired",
    className: "text-gray-400 dark:text-gray-500",
  },
};

export default function ReferralRewardsCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/referral/stats");
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (error) {
      console.error("Error loading referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (stats?.shareUrl) {
      navigator.clipboard.writeText(stats.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-7">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!stats || !stats.shareUrl) return null;

  const progressPct = Math.round(
    ((stats.crewBonusProgress.milestone - stats.crewBonusProgress.remaining) /
      stats.crewBonusProgress.milestone) *
      100,
  );

  return (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-2xl">🔥</div>
        <div>
          <div className="text-[15px] font-bold">Refer & Earn</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            They get a discount, you get paid — 30 days after their first payment clears
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-4 mb-5">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Your referral link</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={stats.shareUrl}
            readOnly
            className="flex-1 bg-white dark:bg-[#111827] px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Code: <span className="font-mono font-bold">{stats.referralCode}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.totalReferred}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Referred</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">
            {formatCents(stats.pendingCents)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCents(stats.paidOutCents)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Paid Out</div>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
            Crew bonus
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats.crewBonusProgress.remaining} more for a free month
          </div>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {stats.crewBonusCount > 0 && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1.5">
            ✓ {stats.crewBonusCount} free month{stats.crewBonusCount > 1 ? "s" : ""} earned
          </div>
        )}
      </div>

      {stats.referrals.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
            Recent Referrals
          </div>
          <div className="space-y-2">
            {stats.referrals.slice(0, 5).map((referral, i) => {
              const label = STATUS_LABELS[referral.status] ?? {
                text: referral.status,
                className: "text-gray-400 dark:text-gray-500",
              };
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {referral.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {new Date(referral.createdAt).toLocaleDateString()} ·{" "}
                      {formatCents(referral.creditCents)}
                    </div>
                  </div>
                  <div className={`text-xs whitespace-nowrap ml-2 ${label.className}`}>
                    {label.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
