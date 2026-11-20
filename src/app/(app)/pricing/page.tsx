"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
  badge?: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$40",
    period: "/month",
    description: "Cancel anytime",
    features: [
      "Unlimited study mode",
      "7,500+ questions from the 2027 reading lists",
      "90-question exam simulations",
      "Weak area analysis",
      "Performance analytics",
      "Mobile app access",
      "Cancel anytime",
    ],
  },
  {
    id: "six_month",
    name: "6-Month Access",
    price: "$200",
    period: "one-time",
    description: "Best value - full access for 6 months",
    features: [
      "Everything in Monthly",
      "6 months of full access",
      "One payment, no auto-renewal",
      "Save $40 vs. 6 months of monthly",
      "Built from the official 2027 MA reading lists",
    ],
    recommended: true,
    badge: "BEST VALUE",
  },
  {
    id: "exam_prep",
    name: "1-Year Exam Prep Bundle",
    price: "$300",
    period: "one-time",
    description: "Full access for 12 months",
    features: [
      "Everything in Monthly",
      "12 months of full access",
      "One payment, no auto-renewal",
      "Save $180 vs. 12 months of monthly",
      "33% less than FiredUp",
      "Built from the official 2027 MA reading lists",
    ],
  },
];

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams?.get("payment");
  useEffect(() => {
    if (paymentStatus === "success") track("purchase_completed");
  }, [paymentStatus]);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
    };
    init();
  }, []);

  // If they picked a plan on the public /plans page before signing up,
  // scroll to and highlight that tier here so the choice carries through.
  useEffect(() => {
    const intendedPlan = user?.user_metadata?.intended_plan;
    if (!intendedPlan) return;
    const el = cardRefs.current[intendedPlan];
    if (!el) return;
    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timer);
  }, [user]);

  const handleSubscribe = async (planType: string) => {
    if (!user) return;

    setLoading(planType);
    track("checkout_started", { plan: planType });

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: planType, userId: user.id }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session. Please try again.");
        setLoading(null);
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("An error occurred. Please try again.");
      setLoading(null);
    }
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Firefighter";
  const intendedPlan = user?.user_metadata?.intended_plan;

  if (!user) return null;

  return (
    <div
      style={{
        flex: 1,
        padding: "36px 40px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--text-strong)",
          }}
        >
          7,500+ Questions. One Exam. Zero Wasted Time.
        </div>
        <div style={{ fontSize: 15, color: "var(--text-soft)", marginBottom: 16 }}>
          Built from the official 2027 MA reading lists • Built by MA firefighters for MA
          firefighters
        </div>

        {/* Payment status alerts */}
        {paymentStatus === "success" && (
          <div
            style={{
              background: "#d1fae5",
              border: "1px solid #6ee7b7",
              borderRadius: 10,
              padding: 14,
              marginBottom: 20,
              fontSize: 14,
              color: "#065f46",
              fontWeight: 600,
            }}
          >
            ✅ Payment successful! You now have full access to RankUp.
          </div>
        )}
        {paymentStatus === "canceled" && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: 10,
              padding: 14,
              marginBottom: 20,
              fontSize: 14,
              color: "#991b1b",
              fontWeight: 600,
            }}
          >
            Payment was canceled. You can try again below.
          </div>
        )}

        {/* Social proof */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            fontSize: 13,
            color: "var(--text-soft)",
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <div>✓ 7,500+ questions from the 2027 reading lists</div>
          <div>✓ 33% less than FiredUp</div>
          <div>✓ Exam date: April 12, 2027</div>
        </div>
      </div>

      {/* Competitive advantage callout */}
      <div
        style={{
          background: "var(--callout-bg)",
          border: "1px solid var(--callout-border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--callout-title)",
            marginBottom: 6,
          }}
        >
          🎯 Why pay $450 for nationwide content?
        </div>
        <div style={{ fontSize: 14, color: "var(--callout-text)" }}>
          Every question is from the actual MA reading list — no California
          building codes, no Texas-specific content. Just what you need to pass.
        </div>
      </div>

      {/* Pricing cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        {PRICING_TIERS.map((tier) => {
          const isIntended = tier.id === intendedPlan;
          return (
          <div
            key={tier.id}
            ref={(el) => {
              cardRefs.current[tier.id] = el;
            }}
            style={{
              background: "var(--white)",
              border: isIntended
                ? "2px solid #16a34a"
                : tier.recommended
                  ? "2px solid var(--red)"
                  : "1px solid var(--card-border)",
              borderRadius: 14,
              padding: 28,
              position: "relative",
              boxShadow: isIntended
                ? "0 10px 30px rgba(22, 163, 74, 0.18)"
                : tier.recommended
                  ? "0 10px 30px rgba(220, 38, 38, 0.15)"
                  : "none",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {isIntended && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  right: 16,
                  background: "#16a34a",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                ✓ YOUR PICK
              </div>
            )}
            {/* Badge */}
            {tier.badge && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: tier.recommended ? "var(--red)" : "#b45309",
                  color: "#fff",
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                {tier.badge}
              </div>
            )}

            {/* Plan name */}
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-strong)",
                marginBottom: 8,
              }}
            >
              {tier.name}
            </div>

            {/* Description */}
            <div style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 20 }}>
              {tier.description}
            </div>

            {/* Price */}
            <div style={{ marginBottom: 24 }}>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: tier.recommended ? "var(--red)" : "var(--text-strong)",
                }}
              >
                {tier.price}
              </span>
              <span style={{ fontSize: 16, color: "var(--text-soft)", fontWeight: 600 }}>
                {tier.period}
              </span>
            </div>

            {/* Features */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 24,
                flex: 1,
              }}
            >
              {tier.features.map((feature, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 13,
                    color: "var(--text-body)",
                  }}
                >
                  <span
                    style={{
                      color: tier.recommended ? "var(--red)" : "#059669",
                      fontSize: 16,
                    }}
                  >
                    ✓
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <button
              onClick={() => handleSubscribe(tier.id)}
              disabled={loading === tier.id}
              style={{
                width: "100%",
                padding: "13px 24px",
                background: tier.recommended ? "#C0392B" : "#2f4a7d",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading === tier.id ? "not-allowed" : "pointer",
                opacity: loading === tier.id ? 0.6 : 1,
                marginTop: "auto",
              }}
            >
              {loading === tier.id ? "Loading..." : "Get Started"}
            </button>
          </div>
          );
        })}
      </div>

      {/* Testimonial */}
      <div
        style={{
          background: "var(--surface-soft)",
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: 28,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "var(--text-body)",
            marginBottom: 12,
            lineHeight: 1.6,
          }}
        >
          "Every question was from the actual reading list. No fluff, no wasted
          time studying irrelevant material. Worth every dollar."
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>
          — Jeff S., MA Firefighter
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginTop: 40 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-strong)",
            marginBottom: 20,
          }}
        >
          Frequently Asked Questions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-strong)",
                marginBottom: 6,
              }}
            >
              What happens after my trial ends?
            </div>
            <div style={{ fontSize: 14, color: "var(--text-soft)" }}>
              You'll keep limited free access: 1 study question and 1
              flashcard per day (resets at midnight Eastern). Exam Mode is for
              subscribers. Subscribe anytime to unlock everything again.
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-strong)",
                marginBottom: 6,
              }}
            >
              Can I cancel my monthly subscription?
            </div>
            <div style={{ fontSize: 14, color: "var(--text-soft)" }}>
              Yes, cancel anytime. We'll save your progress for 90 days if you
              want to come back.
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-strong)",
                marginBottom: 6,
              }}
            >
              Which plan should I choose?
            </div>
            <div style={{ fontSize: 14, color: "var(--text-soft)" }}>
              Monthly is $40/month and you can cancel anytime. The 6-Month plan
              is a single $200 payment (that's $40 less than six months of
              Monthly) and does not renew. The 1-Year Exam Prep Bundle is a
              single $300 payment with 12 months of access ($180 less than 12
              months of Monthly) and also does not renew.
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-strong)",
                marginBottom: 6,
              }}
            >
              Do the 6-Month and 1-Year plans renew automatically?
            </div>
            <div style={{ fontSize: 14, color: "var(--text-soft)" }}>
              No. Each is one payment for a fixed period of full access (6 or
              12 months). When it ends, your account goes back to the limited
              free tier and you can buy again anytime.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
