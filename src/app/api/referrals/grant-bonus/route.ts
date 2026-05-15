// src/app/api/referrals/grant-bonus/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("grant_referral_bonus", {
      referee_user_id: userId,
    });

    if (error) {
      console.error("Error granting referral bonus:", error);
      return NextResponse.json(
        { error: "Failed to grant referral bonus", details: error.message },
        { status: 500 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", userId)
      .single();

    if (!profile?.referred_by) {
      return NextResponse.json({
        success: false,
        message: "User has no referrer",
      });
    }

    console.log(
      `✅ Granted referral bonus to user ${profile.referred_by} for referee ${userId}`,
    );

    return NextResponse.json({
      success: true,
      message: "Referral bonus granted",
    });
  } catch (error: any) {
    console.error("Error in grant-bonus endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
