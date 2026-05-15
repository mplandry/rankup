// src/app/api/referrals/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("referral_code, trial_extended_days")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select(
        `
        id,
        referee_id,
        signed_up_at,
        bonus_granted_at,
        first_session_completed_at,
        profiles!referrals_referee_id_fkey (
          full_name,
          email
        )
      `,
      )
      .eq("referrer_id", userId)
      .order("signed_up_at", { ascending: false });

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError);
      return NextResponse.json(
        { error: "Failed to fetch referrals" },
        { status: 500 },
      );
    }

    const totalReferrals = referrals?.length || 0;
    const completedReferrals =
      referrals?.filter((r) => r.bonus_granted_at).length || 0;
    const pendingReferrals = totalReferrals - completedReferrals;
    const totalBonusDays = profile.trial_extended_days || 0;

    return NextResponse.json({
      referralCode: profile.referral_code,
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/signup?ref=${profile.referral_code}`,
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalBonusDays,
      totalBonusWeeks: Math.floor(totalBonusDays / 7),
      referrals: referrals?.map((r) => ({
        id: r.id,
        name: r.profiles?.full_name || "Firefighter",
        email: r.profiles?.email || "",
        signedUpAt: r.signed_up_at,
        bonusGranted: !!r.bonus_granted_at,
        completedFirstSession: !!r.first_session_completed_at,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching referral stats:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
