// src/app/api/referral/stats/route.ts
//
// Returns the current user's referral code, share link, and reward totals
// for the Stripe-credit referral program (referral_rewards /
// referral_crew_bonuses). This is the NEW system's read endpoint — distinct
// from the retired /api/referrals/stats (trial-day system).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CREW_BONUS_MILESTONE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  // RLS scopes both of these reads to rows where the caller is the referrer.
  const { data: rewards, error: rewardsError } = await supabase
    .from("referral_rewards")
    .select(
      "referred_id, plan_type, referrer_credit_cents, status, unlocks_at, created_at",
    )
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  if (rewardsError)
    return NextResponse.json({ error: rewardsError.message }, { status: 500 });

  const { data: crewBonuses } = await supabase
    .from("referral_crew_bonuses")
    .select("milestone, credit_cents")
    .eq("referrer_id", user.id);

  // Referred users' names require a cross-user profile read, which RLS
  // blocks for the cookie-auth client — look those up with the service role.
  const referredIds = (rewards ?? []).map((r) => r.referred_id);
  let namesById: Record<string, string> = {};
  if (referredIds.length) {
    const { createServiceRoleClient } = await import(
      "@/lib/supabase/service-role"
    );
    const admin = createServiceRoleClient();
    const { data: referredProfiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", referredIds);
    namesById = Object.fromEntries(
      (referredProfiles ?? []).map((p) => [
        p.id,
        p.full_name || "A fellow firefighter",
      ]),
    );
  }

  const sumCents = (statuses: string[]) =>
    (rewards ?? [])
      .filter((r) => statuses.includes(r.status))
      .reduce((sum, r) => sum + r.referrer_credit_cents, 0);

  // "unlocked" is the terminal paid-out state in practice (the unlock cron
  // applies the Stripe balance credit before setting this status); "applied"
  // exists in the schema for a future explicit-apply step but isn't set by
  // any code path today.
  const unlockedCount = (rewards ?? []).filter((r) =>
    ["unlocked", "applied"].includes(r.status),
  ).length;

  const crewBonusCents = (crewBonuses ?? []).reduce(
    (sum, c) => sum + c.credit_cents,
    0,
  );

  return NextResponse.json({
    referralCode: profile?.referral_code ?? null,
    shareUrl: profile?.referral_code
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/signup?ref=${profile.referral_code}`
      : null,
    totalReferred: rewards?.length ?? 0,
    pendingCents: sumCents(["pending"]),
    paidOutCents: sumCents(["unlocked", "applied"]) + crewBonusCents,
    expiredCount: (rewards ?? []).filter((r) => r.status === "expired").length,
    crewBonusCount: crewBonuses?.length ?? 0,
    crewBonusProgress: {
      unlockedCount,
      remaining: CREW_BONUS_MILESTONE - (unlockedCount % CREW_BONUS_MILESTONE),
      milestone: CREW_BONUS_MILESTONE,
    },
    referrals: (rewards ?? []).map((r) => ({
      name: namesById[r.referred_id] || "A fellow firefighter",
      planType: r.plan_type,
      creditCents: r.referrer_credit_cents,
      status: r.status,
      unlocksAt: r.unlocks_at,
      createdAt: r.created_at,
    })),
  });
}
