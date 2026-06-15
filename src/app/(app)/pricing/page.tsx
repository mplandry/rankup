"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      "2,100+ MA-specific questions",
      "90-question exam simulations",
      "Weak area analysis",
      "Performance analytics",
      "Mobile app access",
      "Cancel anytime",
    ],
  },
  {
    id: "exam_prep",
    name: "Exam Prep Bundle",
    price: "$300",
    period: "one-time",
    description: "Best value - full access until exam day",
    features: [
      "Everything in Monthly",
      "Access until exam day",
      "No recurring charges",
      "33% less than FiredUp",
      "Save $60+ vs monthly",
      "100% MA reading list coverage",
    ],
    recommended: true,
    badge: "BEST VALUE",
  },
  {
    id: "department",
    name: "Department Rate",
    price: "$250",
    period: "/person",
    description: "5+ firefighters from same department",
    features: [
      "Everything in Exam Prep",
      "17% discount per person",
      "Department leaderboard",
      "Group progress tracking",
      "Priority support",
      "Contact for group billing",
    ],
    badge: "TEAM PLAN",
  },
];

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams?.get("payment");

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

  const handleSubscribe = async (planType: string) => {
    if (!user) return;

    if (planType === "department") {
      window.location.href =
        "mailto:mplandry77@gmail.com?subject=Department Group Rate - RankUp";
      return;
    }

    setLoading(planType);

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
            color: "#1B2A4A",
          }}
        >
          2,100+ Questions. One Exam. Zero Wasted Time.
        </div>
        <div style={{ fontSize: 15, color: "#64748b", marginBottom: 16 }}>
          100% MA reading list coverage • Built by MA firefighters for MA
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
            color: "#64748b",
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <div>✓ 2,100+ MA-specific questions</div>
          <div>✓ 33% less than FiredUp</div>
          <div>✓ Exam date: TBD</div>
        </div>
      </div>

      {/* Competitive advantage callout */}
      <div
        style={{
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          border: "1px solid #fcd34d",
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
            color: "#92400e",
            marginBottom: 6,
          }}
        >
          🎯 Why pay $450 for nationwide content?
        </div>
        <div style={{ fontSize: 14, color: "#78350f" }}>
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
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.id}
            style={{
              background: "#fff",
              border: tier.recommended
                ? "2px solid var(--red)"
                : "1px solid #e0e6ed",
              borderRadius: 14,
              padding: 28,
              position: "relative",
              boxShadow: tier.recommended
                ? "0 10px 30px rgba(220, 38, 38, 0.15)"
                : "none",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Badge */}
            {tier.badge && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: tier.recommended ? "var(--red)" : "#f59e0b",
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
                color: "#1B2A4A",
                marginBottom: 8,
              }}
            >
              {tier.name}
            </div>

            {/* Description */}
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              {tier.description}
            </div>

            {/* Price */}
            <div style={{ marginBottom: 24 }}>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: tier.recommended ? "var(--red)" : "#1B2A4A",
                }}
              >
                {tier.price}
              </span>
              <span style={{ fontSize: 16, color: "#64748b", fontWeight: 600 }}>
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
                    color: "#475569",
                  }}
                >
                  <span
                    style={{
                      color: tier.recommended ? "var(--red)" : "#10b981",
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
                background: tier.recommended ? "var(--red)" : "#1B2A4A",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading === tier.id ? "not-allowed" : "pointer",
                opacity: loading === tier.id ? 0.6 : 1,
              }}
            >
              {loading === tier.id
                ? "Loading..."
                : tier.id === "department"
                  ? "Contact Us"
                  : "Get Started"}
            </button>
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e0e6ed",
          borderRadius: 12,
          padding: 28,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "#475569",
            marginBottom: 12,
            lineHeight: 1.6,
          }}
        >
          "Every question was from the actual reading list. No fluff, no wasted
          time studying irrelevant material. Worth every dollar."
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1B2A4A" }}>
          — MA Firefighter, 15 Years on the Job
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginTop: 40 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1B2A4A",
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
                color: "#1B2A4A",
                marginBottom: 6,
              }}
            >
              What happens after my trial ends?
            </div>
            <div style={{ fontSize: 14, color: "#64748b" }}>
              You'll get downgraded to limited access (10 questions/day).
              Subscribe anytime to unlock everything again.
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#1B2A4A",
                marginBottom: 6,
              }}
            >
              Can I cancel my monthly subscription?
            </div>
            <div style={{ fontSize: 14, color: "#64748b" }}>
              Yes, cancel anytime. We'll save your progress for 90 days if you
              want to come back.
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#1B2A4A",
                marginBottom: 6,
              }}
            >
              Is the Exam Prep Bundle really a better deal?
            </div>
            <div style={{ fontSize: 14, color: "#64748b" }}>
              Yes! 9 months of monthly = $360. Exam Prep Bundle = $300 one-time
              through exam day. Saves you $60.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
