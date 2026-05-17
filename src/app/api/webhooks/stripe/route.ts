// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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
