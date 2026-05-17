// src/app/api/referrals/grant-bonus/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  const supabase = createClient();
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

    return NextResponse.json({
      success: true,
      message: "Referral bonus granted successfully",
      data,
    });
  } catch (error: any) {
    console.error("Error in grant-bonus route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
