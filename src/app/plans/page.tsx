"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import "../landing.css";
import "./plans.css";

const TIERS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$40",
    period: "/month",
    description: "Cancel anytime",
    features: [
      "Unlimited study mode",
      "2,500+ MA-specific questions",
      "90-question exam simulations",
      "Weak area analysis",
      "Performance analytics",
      "Mobile app access",
    ],
    cta: "Get Started Free",
    href: "/signup?plan=monthly",
    ctaStyle: "secondary",
  },
  {
    id: "exam_prep",
    name: "Exam Prep Bundle",
    price: "$300",
    period: "one-time",
    description: "Best value — full access until exam day",
    features: [
      "Everything in Monthly",
      "Access until exam day",
      "No recurring charges",
      "33% less than FiredUp",
      "Save $60+ vs. monthly",
      "100% MA reading list coverage",
    ],
    cta: "Get Started Free",
    href: "/signup?plan=exam_prep",
    ctaStyle: "primary",
    recommended: true,
    badge: "BEST VALUE",
  },
  {
    id: "department",
    name: "Department Rate",
    price: "$250",
    period: "/person",
    description: "5+ firefighters from the same department",
    features: [
      "Everything in Exam Prep",
      "17% discount per person",
      "Department leaderboard",
      "Group progress tracking",
      "Priority support",
    ],
    cta: "Contact Us",
    href: "mailto:support@rankupfire.com?subject=Department%20Rate%20Inquiry",
    ctaStyle: "secondary",
    badge: "TEAM PLAN",
  },
];

export default function PlansPage() {
  return (
    <>
      <nav>
        <Link href='/' className='nav-logo'>
          <div className='nav-logo-icon'>R</div>
          <span className='nav-logo-text'>
            Rank<span>Up</span>
          </span>
        </Link>
        <div className='nav-actions'>
          <Link href='/plans' className='btn-ghost'>
            Pricing
          </Link>
          <ThemeToggle variant='inverted' />
          <Link href='/login' className='btn-ghost'>
            Log In
          </Link>
          <Link href='/signup' className='btn-primary-nav'>
            Get Started Free
          </Link>
        </div>
      </nav>

      <section className='pricing-hero'>
        <div className='pricing-hero-inner'>
          <div className='pricing-badge'>
            <span className='badge-dot' /> Simple Pricing
          </div>
          <h1 className='pricing-title'>
            2,500+ Questions. <span className='gold'>One Exam.</span>
          </h1>
          <p className='pricing-sub'>
            100% MA reading list coverage. Built by MA firefighters, for MA
            firefighters — no nationwide filler content, just what you need
            to pass.
          </p>
        </div>
      </section>

      <section className='pricing-section'>
        <div className='pricing-grid'>
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`pricing-card${tier.recommended ? " recommended" : ""}`}
            >
              {tier.badge && (
                <div
                  className={`pricing-card-badge ${tier.recommended ? "red" : "gold"}`}
                >
                  {tier.badge}
                </div>
              )}
              <div className='pricing-card-name'>{tier.name}</div>
              <div className='pricing-card-desc'>{tier.description}</div>
              <div className='pricing-card-price'>
                <span className='amount'>{tier.price}</span>
                <span className='period'>{tier.period}</span>
              </div>
              <div className='pricing-card-features'>
                {tier.features.map((f) => (
                  <div key={f}>
                    <span className='check'>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href={tier.href} className={`pricing-card-cta ${tier.ctaStyle}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className='pricing-note'>
          All plans start with a free trial — no credit card required. Prices
          shown in USD.
        </p>
      </section>

      <section className='pricing-faq'>
        <div className='pricing-faq-inner'>
          <div className='section-label'>FAQ</div>
          <h2 className='section-title' style={{ marginBottom: 40 }}>
            Questions, answered
          </h2>
          <div className='pricing-faq-item'>
            <div className='pricing-faq-q'>
              What happens after my trial ends?
            </div>
            <div className='pricing-faq-a'>
              You&apos;ll get downgraded to limited access (1 question/day).
              Subscribe anytime to unlock everything again.
            </div>
          </div>
          <div className='pricing-faq-item'>
            <div className='pricing-faq-q'>
              Can I cancel my monthly subscription?
            </div>
            <div className='pricing-faq-a'>
              Yes, cancel anytime. We&apos;ll save your progress for 90 days
              if you want to come back.
            </div>
          </div>
          <div className='pricing-faq-item'>
            <div className='pricing-faq-q'>
              Is the Exam Prep Bundle really a better deal?
            </div>
            <div className='pricing-faq-a'>
              Yes — 9 months of Monthly costs $360. The Exam Prep Bundle is
              $300 one-time through exam day, saving you $60+.
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className='footer-links'>
          <Link href='/plans'>Pricing</Link>
          <Link href='/login'>Log In</Link>
          <Link href='/signup'>Sign Up</Link>
          <Link href='/privacy'>Privacy Policy</Link>
          <Link href='/terms'>Terms of Service</Link>
          <a href='mailto:support@rankupfire.com'>Contact</a>
        </div>
      </footer>
    </>
  );
}
