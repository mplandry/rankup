// src/app/api/cron/expire-plans/route.ts
//
// Daily sweep: the 6-month plan is a one-time payment, not a Stripe
// subscription, so nothing in Stripe ends it. This flips accounts whose
// subscription_ends_at has passed from "active" to "expired", which puts them
// back on the free tier everywhere subscription_status is checked.
// Hit by a Vercel Cron job (see vercel.json) with the standard
// `Authorization: Bearer ${CRON_SECRET}` header.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data: expired, error } = await supabase
    .from("profiles")
    .update({ subscription_status: "expired", updated_at: nowIso })
    .eq("subscription_plan", "six_month")
    .eq("subscription_status", "active")
    .lt("subscription_ends_at", nowIso)
    .select("id");

  if (error) {
    console.error("expire-plans failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The trial-nudge cron emails any non-active student whose trial is over
  // with "Your RankUp trial has ended". That's the wrong message for someone
  // whose paid plan just ended, so mark that nudge as already handled.
  const ids = (expired ?? []).map((p) => p.id);
  if (ids.length > 0) {
    await supabase
      .from("profiles")
      .update({ trial_nudge_expired_sent_at: nowIso })
      .in("id", ids)
      .is("trial_nudge_expired_sent_at", null);
  }

  console.log(`expire-plans: expired ${ids.length} account(s)`);
  return NextResponse.json({ expired: ids.length });
}
