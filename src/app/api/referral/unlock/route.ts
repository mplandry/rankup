// src/app/api/referral/unlock/route.ts
//
// Daily sweep: pays out referrer credits whose 30-day hold has passed, and
// grants the crew bonus (every 3rd unlocked referral = free month). Meant to
// be hit by a Vercel Cron job (see vercel.json) with the standard
// `Authorization: Bearer ${CRON_SECRET}` header Vercel attaches automatically.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { CREW_BONUS_CREDIT_CENTS, CREW_BONUS_MILESTONE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });
  const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
  const supabase = createServiceRoleClient();

  let unlocked = 0;
  let crewBonusesGranted = 0;
  let skippedNoCustomer = 0;
  const errors: string[] = [];

  try {
    const { data: due, error: dueError } = await supabase
      .from("referral_rewards")
      .select("id, referrer_id, referred_id, plan_type, referrer_credit_cents")
      .eq("status", "pending")
      .lte("unlocks_at", new Date().toISOString());

    if (dueError) throw dueError;

    for (const reward of due ?? []) {
      try {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("stripe_customer_id")
          .eq("id", reward.referrer_id)
          .single();

        // Referrer hasn't made their own Stripe purchase yet, so there's no
        // customer to credit. Leave the reward pending — don't mark it
        // unlocked when nothing was actually paid out — and retry on the
        // next sweep.
        if (!referrer?.stripe_customer_id) {
          skippedNoCustomer++;
          continue;
        }

        await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
          amount: -reward.referrer_credit_cents,
          currency: "usd",
          description: `Referral credit (${reward.plan_type}) for referring user ${reward.referred_id}`,
        });

        await supabase
          .from("referral_rewards")
          .update({ status: "unlocked", applied_at: new Date().toISOString() })
          .eq("id", reward.id);

        unlocked++;

        // Crew multiplier: every Nth unlocked (or already-applied) referral.
        const { count } = await supabase
          .from("referral_rewards")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", reward.referrer_id)
          .in("status", ["unlocked", "applied"]);

        if (count && count % CREW_BONUS_MILESTONE === 0) {
          const { error: insertErr } = await supabase
            .from("referral_crew_bonuses")
            .insert({
              referrer_id: reward.referrer_id,
              milestone: count,
              credit_cents: CREW_BONUS_CREDIT_CENTS,
              granted_at: new Date().toISOString(),
            });

          if (!insertErr) {
            // referrer.stripe_customer_id is guaranteed set at this point.
            await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
              amount: -CREW_BONUS_CREDIT_CENTS,
              currency: "usd",
              description: `Crew bonus — ${count} referrals unlocked`,
            });
            crewBonusesGranted++;
          } else if (insertErr.code !== "23505") {
            // 23505 = unique_violation, meaning this milestone was already granted. Anything else is a real error.
            errors.push(`crew bonus for ${reward.referrer_id}: ${insertErr.message}`);
          }
        }
      } catch (err: any) {
        console.error(`Failed to unlock referral_reward ${reward.id}:`, err);
        errors.push(`reward ${reward.id}: ${err.message}`);
      }
    }

    return NextResponse.json({ unlocked, crewBonusesGranted, skippedNoCustomer, errors });
  } catch (error: any) {
    console.error("Error in referral unlock sweep:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
