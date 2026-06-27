// src/app/api/cron/trial-nudge/route.ts
//
// Daily sweep: emails trial users a "subscribe now" nudge at two milestones —
// 3 days left in their trial, and the day their trial expires. Each milestone
// fires once per user (tracked via profiles.trial_nudge_3day_sent_at /
// trial_nudge_expired_sent_at) so re-running the sweep never double-sends.
// Meant to be hit by a Vercel Cron job (see vercel.json) with the standard
// `Authorization: Bearer ${CRON_SECRET}` header Vercel attaches automatically.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { FIRE_RED, FIRE_ORANGE, FIRE_NAVY } from "@/lib/constants";

export const dynamic = "force-dynamic";

function daysRemaining(trialEndsAt: string, trialExtendedDays: number | null) {
  const effectiveEnd = new Date(trialEndsAt);
  effectiveEnd.setDate(effectiveEnd.getDate() + (trialExtendedDays || 0));
  const now = new Date();
  return Math.ceil((effectiveEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function threeDayEmailHtml(name: string, daysLeft: number) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${FIRE_NAVY};">Hey ${name}! ⏰</h2>
      <p>Your RankUp free trial ends in <strong>${daysLeft} day${daysLeft === 1 ? "" : "s"}</strong>.</p>
      <p>Subscribe now to keep unlimited access to:</p>
      <ul>
        <li>📚 2,500+ MA-specific exam questions</li>
        <li>📝 90-question exam simulations</li>
        <li>🎯 Weak area analysis &amp; progress tracking</li>
      </ul>
      <p style="margin-top: 30px;">
        <a href="https://rankupfire.com/pricing" style="background: ${FIRE_ORANGE}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
          View Plans &amp; Subscribe
        </a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        You're receiving this because your RankUp trial is ending soon.
      </p>
    </div>
  `;
}

function expiredEmailHtml(name: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${FIRE_NAVY};">Hey ${name},</h2>
      <p>Your RankUp free trial has ended. You're now limited to 1 question/day until you subscribe.</p>
      <p><strong>Don't lose momentum before exam day.</strong> Subscribe now to get back to:</p>
      <ul>
        <li>📚 Unlimited study mode &amp; 2,500+ questions</li>
        <li>📝 Full 90-question exam simulations</li>
        <li>🎯 Your saved progress and weak-area analysis</li>
      </ul>
      <p style="margin-top: 30px;">
        <a href="https://rankupfire.com/pricing" style="background: ${FIRE_RED}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
          Subscribe Now
        </a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        You're receiving this because your RankUp trial has expired.
      </p>
    </div>
  `;
}

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY || "");
  const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
  const supabase = createServiceRoleClient();

  let sent3Day = 0;
  let sentExpired = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const { data: candidates, error: fetchError } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, trial_ends_at, trial_extended_days, subscription_status, trial_nudge_3day_sent_at, trial_nudge_expired_sent_at",
      )
      .eq("role", "student")
      .neq("subscription_status", "active")
      .not("trial_ends_at", "is", null);

    if (fetchError) throw fetchError;

    for (const profile of candidates ?? []) {
      try {
        const remaining = daysRemaining(profile.trial_ends_at, profile.trial_extended_days);
        const name = profile.full_name || "there";

        if (remaining > 0 && remaining <= 3 && !profile.trial_nudge_3day_sent_at) {
          await resend.emails.send({
            from: "RankUp <support@rankupfire.com>",
            to: profile.email,
            subject: `${remaining} day${remaining === 1 ? "" : "s"} left in your RankUp trial`,
            html: threeDayEmailHtml(name, remaining),
          });
          await supabase
            .from("profiles")
            .update({ trial_nudge_3day_sent_at: new Date().toISOString() })
            .eq("id", profile.id);
          sent3Day++;
        } else if (remaining <= 0 && !profile.trial_nudge_expired_sent_at) {
          await resend.emails.send({
            from: "RankUp <support@rankupfire.com>",
            to: profile.email,
            subject: "Your RankUp trial has ended — subscribe to keep studying",
            html: expiredEmailHtml(name),
          });
          await supabase
            .from("profiles")
            .update({ trial_nudge_expired_sent_at: new Date().toISOString() })
            .eq("id", profile.id);
          sentExpired++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        console.error(`Failed to send trial nudge to ${profile.id}:`, err);
        errors.push(`profile ${profile.id}: ${err.message}`);
      }
    }

    return NextResponse.json({ sent3Day, sentExpired, skipped, errors });
  } catch (error: any) {
    console.error("Error in trial nudge sweep:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
