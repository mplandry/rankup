// src/app/api/cron/orphaned-signups/route.ts
//
// Daily sweep: the AFTER INSERT ON auth.users trigger (handle_new_user())
// that creates a matching public.profiles row on signup swallows errors via
// its EXCEPTION WHEN OTHERS handler — so a failure there leaves someone with
// a working login but no profiles row, which makes them completely invisible
// on /admin/students (that page only queries public.profiles). This
// happened silently to 6 real signups between March and June 2026 before
// anyone noticed (see backfill_missing_profiles migration).
//
// This sweep finds any auth.users row with no matching profiles row,
// backfills it using the same column list/defaults handle_new_user() uses
// (so the student is immediately unblocked), and emails the admin a summary
// so a silent trigger failure never goes unnoticed again.
//
// Meant to be hit by a Vercel Cron job (see vercel.json) with the standard
// `Authorization: Bearer ${CRON_SECRET}` header Vercel attaches automatically.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { FIRE_NAVY } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "mplandry77@gmail.com";

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
  const supabase = createServiceRoleClient();

  try {
    const { data: profileRows, error: profileErr } = await supabase
      .from("profiles")
      .select("id");
    if (profileErr) throw profileErr;
    const profileIds = new Set((profileRows ?? []).map((p) => p.id));

    const authUsers: { id: string; email: string | undefined; raw_user_meta_data: any }[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      authUsers.push(...data.users.map((u) => ({
        id: u.id,
        email: u.email,
        raw_user_meta_data: u.user_metadata,
      })));
      if (data.users.length < 200) break;
      page++;
    }

    const orphans = authUsers.filter((u) => !profileIds.has(u.id));

    const backfilled: { id: string; email: string; full_name: string }[] = [];
    const failed: string[] = [];

    for (const orphan of orphans) {
      const meta = orphan.raw_user_meta_data || {};
      const email = orphan.email || "";
      const full_name = meta.full_name || email.split("@")[0] || "Unknown";
      const { error: insertErr } = await supabase.from("profiles").insert({
        id: orphan.id,
        email,
        full_name,
        role: "student",
        exam_type: meta.exam_type === "captain" ? "captain" : "lieutenant",
        department: meta.department || null,
        subscription_tier: "full_access",
      });
      if (insertErr) {
        failed.push(`${email} (${orphan.id}): ${insertErr.message}`);
      } else {
        backfilled.push({ id: orphan.id, email, full_name });
      }
    }

    if (backfilled.length > 0 || failed.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY || "");
      const rows = backfilled
        .map((b) => `<li>${b.full_name} — ${b.email}</li>`)
        .join("");
      const failedRows = failed.map((f) => `<li>${f}</li>`).join("");
      await resend.emails.send({
        from: "RankUp <support@rankupfire.com>",
        to: ADMIN_EMAIL,
        subject: `RankUp: ${backfilled.length} signup(s) had a missing profile (auto-fixed)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${FIRE_NAVY};">Orphaned signup sweep</h2>
            ${
              backfilled.length > 0
                ? `<p>These signups had no profiles row (invisible on /admin/students) and were auto-backfilled just now:</p><ul>${rows}</ul>`
                : ""
            }
            ${
              failed.length > 0
                ? `<p style="color: #C0392B;"><strong>These could NOT be backfilled automatically — needs manual attention:</strong></p><ul>${failedRows}</ul>`
                : ""
            }
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Automated daily sweep from /api/cron/orphaned-signups.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      checked: authUsers.length,
      orphansFound: orphans.length,
      backfilled: backfilled.length,
      failed: failed.length,
      details: { backfilled, failed },
    });
  } catch (error: any) {
    console.error("Error in orphaned-signups sweep:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
