// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { REFERRAL_TIERS, REFERRAL_UNLOCK_DAYS } from "@/lib/constants";
import { sendPaymentAlert } from "@/lib/payment-alerts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Initialize Stripe client at runtime to avoid build-time evaluation
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });

  // Dynamic import to avoid build-time evaluation
  const { createServiceRoleClient } =
    await import("@/lib/supabase/service-role");
  const supabase = createServiceRoleClient();

  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Log every verified event for debugging/auditability, regardless of
  // whether we have a handler for it below. Ignore duplicate-insert errors
  // (23505) since Stripe can redeliver the same event id on retry.
  const { error: logError } = await supabase
    .from("stripe_webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
      processed: false,
    });

  if (logError && logError.code !== "23505") {
    console.error("Failed to log webhook event:", logError);
  }

  // Stripe redelivers events on any non-2xx response. If this event already
  // finished processing once, don't send the payment alert email again.
  let alreadyProcessed = false;
  if (logError?.code === "23505") {
    const { data: prior } = await supabase
      .from("stripe_webhook_events")
      .select("processed")
      .eq("event_id", event.id)
      .maybeSingle();
    alreadyProcessed = !!prior?.processed;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const subscriptionPlan = session.metadata?.subscription_plan;

        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        const plan = subscriptionPlan || "monthly";

        // The 6-month plan is a one-time payment that expires. If they buy it
        // again while still active, extend from the current end date so they
        // don't lose the time they already paid for. The daily
        // /api/cron/expire-plans job flips expired accounts off.
        let subscriptionEndsAt: string | null = null;
        if (plan === "six_month") {
          const { data: existing } = await supabase
            .from("profiles")
            .select("subscription_plan, subscription_status, subscription_ends_at")
            .eq("id", userId)
            .single();

          const base = new Date();
          if (
            existing?.subscription_plan === "six_month" &&
            existing.subscription_status === "active" &&
            existing.subscription_ends_at
          ) {
            const currentEnd = new Date(existing.subscription_ends_at);
            if (currentEnd > base) base.setTime(currentEnd.getTime());
          }
          base.setMonth(base.getMonth() + 6);
          subscriptionEndsAt = base.toISOString();
        }

        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_tier: "full_access",
            subscription_plan: plan,
            subscription_ends_at: subscriptionEndsAt,
            subscription_started_at: new Date().toISOString(),
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        console.log(`✅ Activated subscription for user ${userId}`);

        // Record the payment. Retrieve the PaymentIntent for the actual
        // payment method used (session.payment_method_types is the list of
        // *allowed* methods, not what the customer actually paid with).
        if (session.payment_intent) {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent.id;

          try {
            const paymentIntent =
              await stripe.paymentIntents.retrieve(paymentIntentId);

            const { error: paymentError } = await supabase
              .from("payment_transactions")
              .insert({
                user_id: userId,
                stripe_payment_intent_id: paymentIntentId,
                amount_cents: session.amount_total ?? paymentIntent.amount,
                currency: session.currency ?? paymentIntent.currency,
                status:
                  session.payment_status === "paid" ? "succeeded" : paymentIntent.status,
                payment_method: paymentIntent.payment_method_types?.[0] ?? null,
                plan_type: plan,
              });

            if (paymentError && paymentError.code !== "23505") {
              console.error("Failed to record payment transaction:", paymentError);
            } else {
              console.log(`✅ Recorded payment for user ${userId}`);
            }
          } catch (piError) {
            console.error("Failed to retrieve/record payment intent:", piError);
          }
        } else {
          console.error(
            `checkout.session.completed for user ${userId} has no payment_intent`,
          );
        }

        // Referral payout: if this user was referred and doesn't already have
        // a reward on file, create one. Referrer's credit unlocks in 30 days
        // (see /api/referral/unlock); the referred user's discount, if any,
        // was already applied at checkout via a one-time coupon.
        if (plan === "monthly" || plan === "exam_prep") {
          const { data: referredProfile } = await supabase
            .from("profiles")
            .select("referred_by")
            .eq("id", userId)
            .single();

          if (referredProfile?.referred_by) {
            const tier = REFERRAL_TIERS[plan as "monthly" | "exam_prep"];
            const unlocksAt = new Date();
            unlocksAt.setDate(unlocksAt.getDate() + REFERRAL_UNLOCK_DAYS);

            const { error: rewardError } = await supabase
              .from("referral_rewards")
              .insert({
                referrer_id: referredProfile.referred_by,
                referred_id: userId,
                plan_type: plan,
                referrer_credit_cents: tier.referrerCreditCents,
                referred_discount_cents: tier.referredDiscountCents,
                status: "pending",
                stripe_checkout_session_id: session.id,
                referred_payment_cleared_at: new Date().toISOString(),
                unlocks_at: unlocksAt.toISOString(),
              });

            // 23505 = unique_violation — reward already exists for this user, ignore.
            if (rewardError && rewardError.code !== "23505") {
              console.error("Failed to create referral reward:", rewardError);
            } else if (!rewardError) {
              console.log(`✅ Referral reward pending for referrer ${referredProfile.referred_by}`);
            }
          }
        }

        // Payment alert email to the admin. Never let a failed email make
        // Stripe retry the whole webhook.
        if (!alreadyProcessed) {
          try {
            const { data: payer } = await supabase
              .from("profiles")
              .select("full_name, email, department, referred_by")
              .eq("id", userId)
              .single();

            await sendPaymentAlert({
              kind: "new",
              plan,
              paidCents: session.amount_total ?? 0,
              listCents: session.amount_subtotal,
              discountCents: session.total_details?.amount_discount ?? 0,
              customerName: payer?.full_name ?? null,
              customerEmail: payer?.email ?? session.customer_details?.email ?? null,
              department: payer?.department ?? null,
              referred: !!payer?.referred_by,
              customerId:
                typeof session.customer === "string"
                  ? session.customer
                  : (session.customer?.id ?? null),
              livemode: event.livemode,
            });
          } catch (alertError) {
            console.error("Failed to send payment alert:", alertError);
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;

        // The first invoice of a new subscription is already covered by
        // checkout.session.completed above; only alert on recurring renewals.
        if (invoice.billing_reason !== "subscription_cycle" || alreadyProcessed) {
          break;
        }

        try {
          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : (invoice.customer?.id ?? null);

          const { data: payer } = customerId
            ? await supabase
                .from("profiles")
                .select("full_name, email, department, referred_by, subscription_plan")
                .eq("stripe_customer_id", customerId)
                .maybeSingle()
            : { data: null };

          await sendPaymentAlert({
            kind: "renewal",
            plan: payer?.subscription_plan || "monthly",
            paidCents: invoice.amount_paid,
            listCents: invoice.subtotal,
            discountCents: (invoice.total_discount_amounts ?? []).reduce(
              (sum, d) => sum + d.amount,
              0,
            ),
            customerName: payer?.full_name ?? invoice.customer_name ?? null,
            customerEmail: payer?.email ?? invoice.customer_email ?? null,
            department: payer?.department ?? null,
            referred: !!payer?.referred_by,
            customerId,
            livemode: event.livemode,
          });
        } catch (alertError) {
          console.error("Failed to send renewal alert:", alertError);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          const newStatus =
            subscription.status === "active" ? "active" : "inactive";
          await supabase
            .from("profiles")
            .update({ subscription_status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", profile.id);

          console.log(`✅ Updated subscription status for user ${profile.id}`);

          // Chargeback/cancellation protection: if this user's referral
          // reward hasn't unlocked yet, cancel the payout.
          if (event.type === "customer.subscription.deleted") {
            await supabase
              .from("referral_rewards")
              .update({ status: "expired" })
              .eq("referred_id", profile.id)
              .eq("status", "pending");
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string | null;

        await supabase
          .from("payment_transactions")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", charge.payment_intent as string);

        if (customerId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            await supabase
              .from("referral_rewards")
              .update({ status: "expired" })
              .eq("referred_id", profile.id)
              .eq("status", "pending");

            console.log(`✅ Canceled pending referral reward (refund) for user ${profile.id}`);
          }
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge = await stripe.charges.retrieve(dispute.charge as string);
        const customerId = charge.customer as string | null;

        if (customerId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            await supabase
              .from("referral_rewards")
              .update({ status: "expired" })
              .eq("referred_id", profile.id)
              .eq("status", "pending");

            console.log(`✅ Canceled pending referral reward (dispute) for user ${profile.id}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    await supabase
      .from("stripe_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 },
    );
  }
}
