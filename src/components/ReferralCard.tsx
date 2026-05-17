// src/components/ReferralCard.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
    const supabase = createClient();
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

  const copyToClipboard = () => {
    if (stats?.shareUrl) {
      navigator.clipboard.writeText(stats.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-7">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-2xl">🎁</div>
        <div>
          <div className="text-[15px] font-bold">Refer & Earn</div>
          <div className="text-xs text-gray-500">
            Give {stats.totalBonusWeeks} weeks, get {stats.totalBonusWeeks}{" "}
            weeks
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-5">
        <div className="text-xs text-gray-600 mb-2">Your referral link</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={stats.shareUrl}
            readOnly
            className="flex-1 bg-white px-3 py-2 rounded-lg text-sm border border-gray-200 text-gray-700"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Code: <span className="font-mono font-bold">{stats.referralCode}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalReferrals}
          </div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.completedReferrals}
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalBonusDays}
          </div>
          <div className="text-xs text-gray-500">Bonus Days</div>
        </div>
      </div>

      {stats.referrals && stats.referrals.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase mb-3">
            Recent Referrals
          </div>
          <div className="space-y-2">
            {stats.referrals.slice(0, 3).map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {referral.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {new Date(referral.signedUpAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {referral.bonusGranted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                      <span>✓</span> Completed
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
