// src/app/api/admin/nudge-student/route.ts
//
// Manually send a trial-nudge email to ONE specific student, on demand —
// e.g. when an admin wants to nudge a particular user right now instead of
// waiting for the daily cron sweep (src/app/api/cron/trial-nudge/route.ts).
//
// Unlike the cron sweep, this does not gate on the "<=3 days left" window —
// it sends whichever copy matches the student's actual trial state right
// now (days-left copy if their trial is still active, expired copy if not),
// and stamps the same dedup column the cron checks so the automated sweep
// won't send a duplicate for that same milestone later.
//
// Auth mirrors src/app/api/webhooks/new-student/route.ts: a shared secret
// passed via the `x-webhook-secret` header. Accepts either WEBHOOK_SECRET
// (shared with that route) or ADMIN_NUDGE_SECRET (dedicated to this route),
// so this can be triggered independently of the webhook's secret.

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { FIRE_RED, FIRE_ORANGE, FIRE_NAVY } from "@/lib/constants";

function daysRemaining(trialEndsAt: string, trialExtendedDays: number | null) {
  const effectiveEnd = new Date(trialEndsAt);
  effectiveEnd.setDate(effectiveEnd.getDate() + (trialExtendedDays || 0));
  const now = new Date();
  return Math.ceil((effectiveEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysLeftEmailHtml(name: string, daysLeft: number) {
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

export async function POST(request: Request) {
  try {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    const ADMIN_NUDGE_SECRET = process.env.ADMIN_NUDGE_SECRET;
    const providedSecret = request.headers.get("x-webhook-secret");
    const authorized =
      !!providedSecret &&
      (providedSecret === WEBHOOK_SECRET || providedSecret === ADMIN_NUDGE_SECRET);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, id } = body as { email?: string; id?: string };
    if (!email && !id) {
      return NextResponse.json({ error: "Provide email or id" }, { status: 400 });
    }

    const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
    const supabase = createServiceRoleClient();

    let query = supabase
      .from("profiles")
      .select(
        "id, email, full_name, trial_ends_at, trial_extended_days, subscription_status, trial_nudge_3day_sent_at, trial_nudge_expired_sent_at",
      );
    query = id ? query.eq("id", id) : query.eq("email", email);

    const { data: profile, error: fetchError } = await query.single();
    if (fetchError || !profile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!profile.trial_ends_at) {
      return NextResponse.json(
        { error: "Student has no trial_ends_at set — nothing to nudge about" },
        { status: 400 },
      );
    }

    const remaining = daysRemaining(profile.trial_ends_at, profile.trial_extended_days);
    const name = profile.full_name || "there";
    const resend = new Resend(process.env.RESEND_API_KEY || "");

    let template: "days_left" | "expired";
    let sendResult;
    if (remaining > 0) {
      template = "days_left";
      sendResult = await resend.emails.send({
        from: "RankUp <support@rankupfire.com>",
        to: profile.email,
        subject: `${remaining} day${remaining === 1 ? "" : "s"} left in your RankUp trial`,
        html: daysLeftEmailHtml(name, remaining),
      });
      await supabase
        .from("profiles")
        .update({ trial_nudge_3day_sent_at: new Date().toISOString() })
        .eq("id", profile.id);
    } else {
      template = "expired";
      sendResult = await resend.emails.send({
        from: "RankUp <support@rankupfire.com>",
        to: profile.email,
        subject: "Your RankUp trial has ended — subscribe to keep studying",
        html: expiredEmailHtml(name),
      });
      await supabase
        .from("profiles")
        .update({ trial_nudge_expired_sent_at: new Date().toISOString() })
        .eq("id", profile.id);
    }

    return NextResponse.json({
      ok: true,
      student: { id: profile.id, email: profile.email, name },
      daysRemaining: remaining,
      template,
      resend: sendResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
