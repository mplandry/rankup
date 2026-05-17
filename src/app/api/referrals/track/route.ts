// src/app/api/referrals/track/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
export async function POST(req: NextRequest) {
  const supabase = createClient();
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
        { error: "You cannot refer yourself" },
        { status: 400 },
      );
    }

    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referee_id", userId)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { error: "User already has a referrer" },
        { status: 400 },
      );
    }

    const { error: insertError } = await supabase.from("referrals").insert({
      referrer_id: referrer.id,
      referee_id: userId,
      signed_up_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error creating referral:", insertError);
      return NextResponse.json(
        { error: "Failed to create referral" },
        { status: 500 },
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
    }

    return NextResponse.json({
      success: true,
      message: "Referral tracked successfully",
    });
  } catch (error: any) {
    console.error("Error in track-referral route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
