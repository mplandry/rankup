// src/app/api/referrals/track/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
export async function POST(req: NextRequest) {
  try {
    const { referralCode, userId } = await req.json();

    if (!referralCode || !userId) {
      return NextResponse.json(
        { error: "Referral code and user ID required" },
        { status: 400 },
      );
    }

    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 },
      );
    }

    if (referrer.id === userId) {
      return NextResponse.json(
        { error: "Cannot use your own referral code" },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        referred_by: referrer.id,
        trial_extended_days: 14,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating referee profile:", updateError);
      return NextResponse.json(
        { error: "Failed to apply referral bonus" },
        { status: 500 },
      );
    }

    const { error: referralError } = await supabase.from("referrals").insert({
      referrer_id: referrer.id,
      referee_id: userId,
      referral_code: referralCode.toUpperCase(),
      bonus_days_granted: 14,
    });

    if (referralError) {
      console.error("Error creating referral record:", referralError);
    }

    console.log(`✅ Referral tracked: ${referrer.id} → ${userId}`);

    return NextResponse.json({
      success: true,
      bonusDays: 14,
      message: "You got +2 weeks trial from this referral!",
    });
  } catch (error: any) {
    console.error("Error tracking referral:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
