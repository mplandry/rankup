// src/app/api/webhooks/stripe/route.ts
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

  // Log webhook event
  await supabase.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
    event_data: event.data.object,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const subscriptionPlan = session.metadata?.subscription_plan;

        if (!userId) break;

        // Log payment transaction
        await supabase.from("payment_transactions").insert({
          user_id: userId,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "succeeded",
          subscription_plan: subscriptionPlan,
        });

        // Update user profile
        const updates: any = {
          subscription_status: "active",
          subscription_plan: subscriptionPlan,
          subscription_started_at: new Date().toISOString(),
        };

        if (session.mode === "subscription") {
          updates.stripe_subscription_id = session.subscription;
        }

        if (subscriptionPlan === "exam_prep") {
          // Exam prep bundle: access until April 7, 2026
          updates.subscription_ends_at = "2026-04-07T23:59:59Z";
        }

        await supabase.from("profiles").update(updates).eq("id", userId);

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
          await supabase
            .from("profiles")
            .update({
              subscription_status:
                subscription.status === "active" ? "active" : "expired",
            })
            .eq("id", profile.id);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Payment succeeded - already handled in checkout.session.completed
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("Payment failed:", paymentIntent.id);
        // TODO: Send email notification to user
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
