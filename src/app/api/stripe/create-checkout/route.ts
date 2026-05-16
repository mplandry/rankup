// src/app/api/stripe/create-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: "Missing priceId or userId" },
        { status: 400 },
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Determine pricing based on priceId
    const pricingMap: Record<
      string,
      { amount: number; plan: string; mode: "subscription" | "payment" }
    > = {
      monthly: { amount: 4000, plan: "monthly", mode: "subscription" },
      exam_prep: { amount: 30000, plan: "exam_prep", mode: "payment" },
      department: { amount: 25000, plan: "department", mode: "payment" },
    };

    const pricing = pricingMap[priceId];
    if (!pricing) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // Create checkout session
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
                    ? "One-time payment - access until April 7, 2026"
                    : "Department group pricing (5+ firefighters)",
            },
            unit_amount: pricing.amount,
            ...(pricing.mode === "subscription" && {
              recurring: {
                interval: "month",
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: pricing.mode,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?payment=cancelled`,
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
