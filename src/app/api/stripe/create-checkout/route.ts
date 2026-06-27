// src/app/api/stripe/create-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { REFERRAL_TIERS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });

  const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
  const supabase = createServiceRoleClient();

  try {
    const { priceId, userId } = await request.json();

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: "Missing priceId or userId" },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name, referred_by")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    const pricingMap: Record<string, { amount: number; plan: string; mode: "subscription" | "payment" }> = {
      monthly: { amount: 4000, plan: "monthly", mode: "subscription" },
      exam_prep: { amount: 30000, plan: "exam_prep", mode: "payment" },
      department: { amount: 25000, plan: "department", mode: "payment" },
    };

    const pricing = pricingMap[priceId];
    if (!pricing) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // Referred-user discount: 10% off first payment, tiered by plan. Only
    // applies once — skip if this user already has a referral reward on file.
    let discountCents = 0;
    if (profile.referred_by && (pricing.plan === "monthly" || pricing.plan === "exam_prep")) {
      const { data: existingReward } = await supabase
        .from("referral_rewards")
        .select("id")
        .eq("referred_id", userId)
        .maybeSingle();

      if (!existingReward) {
        discountCents = REFERRAL_TIERS[pricing.plan].referredDiscountCents;
      }
    }

    let discounts: Stripe.Checkout.SessionCreateParams["discounts"];
    if (discountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: discountCents,
        currency: "usd",
        duration: "once",
        name: "Referral discount",
      });
      discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                pricing.plan === "monthly"
                  ? "RankUp Monthly Subscription"
                  : pricing.plan === "exam_prep"
                    ? "RankUp Exam Prep Bundle"
                    : "RankUp Department Rate",
              description:
                pricing.plan === "monthly"
                  ? "Full access to all study materials"
                  : pricing.plan === "exam_prep"
                    ? "One-time payment - access until exam day"
                    : "Department group pricing (5+ firefighters)",
            },
            unit_amount: pricing.amount,
            ...(pricing.mode === "subscription" && {
              recurring: { interval: "month" },
            }),
          },
          quantity: 1,
        },
      ],
      mode: pricing.mode,
      ...(discounts ? { discounts } : {}),
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?payment=canceled`,
      metadata: {
        user_id: userId,
        subscription_plan: pricing.plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
