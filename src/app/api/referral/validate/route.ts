// src/app/api/referral/validate/route.ts
//
// Validates a referral code and (if a userId is given) attaches it to that
// user's profile via `referred_by`. Called right after signup when the user
// arrived via a /signup?ref=CODE link. The actual $ reward is created later,
// by the Stripe webhook, once the referred user becomes a paying subscriber.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
  const supabase = createServiceRoleClient();

  try {
    const { referralCode, userId } = await req.json();

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    const code = String(referralCode).trim().toUpperCase();

    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("referral_code", code)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    if (userId && referrer.id === userId) {
      return NextResponse.json({ error: "You cannot refer yourself" }, { status: 400 });
    }

    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", userId)
        .single();

      // Don't clobber an existing referrer.
      if (!profile?.referred_by) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ referred_by: referrer.id })
          .eq("id", userId);

        if (updateError) {
          console.error("Error attaching referrer:", updateError);
          return NextResponse.json(
            { error: "Failed to attach referral", details: updateError.message },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({
      valid: true,
      referrerId: referrer.id,
      referrerName: referrer.full_name || "a fellow firefighter",
    });
  } catch (error: any) {
    console.error("Error in referral validate route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
