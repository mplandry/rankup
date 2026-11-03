// src/lib/payment-alerts.ts
// Emails the admin whenever a customer pays, labeled by plan, with a warning
// when the amount doesn't match what the plan should cost.
import { Resend } from "resend";

const ALERT_TO = process.env.PAYMENT_ALERT_EMAIL || "mplandry77@gmail.com";

// List prices in cents. Keep in sync with pricingMap in
// src/app/api/stripe/create-checkout/route.ts.
export const EXPECTED_LIST_PRICE_CENTS: Record<string, number> = {
  monthly: 4000,
  exam_prep: 30000,
  department: 25000,
};

const PLAN_LABELS: Record<string, string> = {
  monthly: "Monthly subscription",
  exam_prep: "Exam Prep Bundle (one-time, through exam day)",
  department: "Department rate (one-time, per person)",
};

const PLAN_SHORT: Record<string, string> = {
  monthly: "Monthly",
  exam_prep: "Exam Prep",
  department: "Department rate",
};

export type PaymentAlert = {
  kind: "new" | "renewal";
  plan: string;
  paidCents: number;
  /** Price before any discount, when Stripe reports it. */
  listCents?: number | null;
  discountCents?: number;
  customerName?: string | null;
  customerEmail?: string | null;
  department?: string | null;
  referred?: boolean;
  customerId?: string | null;
  livemode?: boolean;
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function sendPaymentAlert(alert: PaymentAlert): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error("Payment alert skipped: RESEND_API_KEY is not set");
    return;
  }

  const expected = EXPECTED_LIST_PRICE_CENTS[alert.plan];
  const discount = alert.discountCents ?? 0;
  const list = alert.listCents ?? alert.paidCents + discount;

  const flags: string[] = [];
  if (expected === undefined) {
    flags.push(`Unknown plan "${alert.plan}" - no expected price on file.`);
  } else if (list !== expected) {
    flags.push(
      `Price mismatch: charged a list price of ${money(list)} but the ${
        PLAN_SHORT[alert.plan] ?? alert.plan
      } plan should be ${money(expected)}.`,
    );
  }
  if (alert.plan === "department") {
    flags.push("Department rate: confirm the department and seat count.");
  }

  const notes: string[] = [];
  if (discount > 0) {
    notes.push(
      `${alert.referred ? "Referral discount" : "Discount"} of ${money(discount)} applied (${money(
        list,
      )} list price).`,
    );
    if (alert.plan === "monthly" && alert.kind === "new") {
      notes.push(
        `Discount was first payment only. Next renewal should be ${money(expected ?? list)}.`,
      );
    }
  }

  const who = alert.customerName || alert.customerEmail || "Unknown customer";
  const planShort = PLAN_SHORT[alert.plan] ?? alert.plan;
  const kindLabel = alert.kind === "renewal" ? "Renewal" : "New payment";
  const warn = flags.some((f) => f.startsWith("Price mismatch") || f.startsWith("Unknown"));
  const subject = `${warn ? "WARNING " : ""}${kindLabel}: ${who} - ${planShort} - ${money(
    alert.paidCents,
  )}`;

  const stripeLink = alert.customerId
    ? `https://dashboard.stripe.com${alert.livemode === false ? "/test" : ""}/customers/${alert.customerId}`
    : null;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#666">${label}</td><td style="padding:4px 0"><strong>${value}</strong></td></tr>`;

  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:15px;color:#111">
      <h2 style="margin:0 0 12px">${esc(kindLabel)}: ${esc(money(alert.paidCents))}</h2>
      <table style="border-collapse:collapse">
        ${row("Customer", esc(who))}
        ${alert.customerEmail ? row("Email", esc(alert.customerEmail)) : ""}
        ${alert.department ? row("Department", esc(alert.department)) : ""}
        ${row("Plan", esc(PLAN_LABELS[alert.plan] ?? alert.plan))}
        ${row("Paid", esc(money(alert.paidCents)))}
        ${discount > 0 ? row("Discount", `-${esc(money(discount))}`) : ""}
        ${alert.livemode === false ? row("Mode", "TEST") : ""}
      </table>
      ${notes.map((n) => `<p style="margin:12px 0 0">${esc(n)}</p>`).join("")}
      ${flags
        .map(
          (f) =>
            `<p style="margin:12px 0 0;padding:8px 12px;background:#fdecea;border-left:4px solid #C0392B">${esc(f)}</p>`,
        )
        .join("")}
      ${stripeLink ? `<p style="margin:16px 0 0"><a href="${stripeLink}">View customer in Stripe</a></p>` : ""}
    </div>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "RankUp <support@rankupfire.com>",
    to: ALERT_TO,
    subject,
    html,
  });
  if (error) {
    throw new Error(`Resend rejected payment alert: ${error.message}`);
  }
}
