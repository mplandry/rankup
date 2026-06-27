// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { REFERRAL_TIERS, REFERRAL_UNLOCK_DAYS } from "@/lib/constants";

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

        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_plan: subscriptionPlan || "monthly",
            stripe_customer_id: session.customer as string,
          })
          .eq("id", userId);

        console.log(`✅ Activated subscription for user ${userId}`);

        // Referral payout: if this user was referred and doesn't already have
        // a reward on file, create one. Referrer's credit unlocks in 30 days
        // (see /api/referral/unlock); the referred user's discount, if any,
        // was already applied at checkout via a one-time coupon.
        const plan = subscriptionPlan || "monthly";
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
            .update({ subscription_status: newStatus })
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

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 },
    );
  }
}
