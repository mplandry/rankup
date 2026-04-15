import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div
      style={{
        background: "#f8f9fb",
        minHeight: "100vh",
        fontFamily: "Georgia,serif",
      }}
    >
      <div
        style={{
          background: "#1B2A4A",
          padding: "24px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href='/'
          style={{
            fontFamily: "sans-serif",
            fontWeight: 900,
            fontSize: "24px",
            color: "white",
            textDecoration: "none",
            letterSpacing: "2px",
          }}
        >
          Rank<span style={{ color: "#F5C842" }}>Up</span>
        </Link>
        <Link
          href='/'
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "14px",
            textDecoration: "none",
            fontFamily: "sans-serif",
          }}
        >
          ← Back to home
        </Link>
      </div>
      <div
        style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px" }}
      >
        <h1
          style={{
            fontFamily: "sans-serif",
            fontWeight: 900,
            fontSize: "36px",
            color: "#1B2A4A",
            marginBottom: "8px",
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            color: "#888",
            fontSize: "14px",
            marginBottom: "48px",
            fontFamily: "sans-serif",
          }}
        >
          Last updated: April 14, 2026
        </p>

        {[
          {
            title: "1. Information We Collect",
            content: `When you create an account on RankUp (rankupfire.com), we collect the following information: your full name, email address, fire department name, and exam type (Lieutenant or Captain). We also collect data about your study sessions, exam scores, and progress within the platform.`,
          },
          {
            title: "2. How We Use Your Information",
            content: `We use your information solely to provide and improve the RankUp service. This includes tracking your study progress, personalizing your experience based on your exam track, and sending service-related communications. We do not sell, rent, or share your personal information with third parties for marketing purposes.`,
          },
          {
            title: "3. Data Storage & Security",
            content: `Your data is stored securely using Supabase, a trusted database platform. We use industry-standard encryption for data transmission and storage. Your password is never stored in plain text. While we take reasonable measures to protect your data, no system is 100% secure.`,
          },
          {
            title: "4. Cookies",
            content: `RankUp uses cookies and similar technologies to maintain your login session and improve your experience. We do not use cookies for advertising or tracking across other websites.`,
          },
          {
            title: "5. Third-Party Services",
            content: `We use the following third-party services to operate RankUp: Supabase (database and authentication), Vercel (hosting), and Stripe (payment processing, when applicable). Each of these services has their own privacy policies governing how they handle data.`,
          },
          {
            title: "6. Your Rights",
            content: `You have the right to access, correct, or delete your personal data at any time. To request deletion of your account and associated data, please contact us at privacy@rankupfire.com. We will process your request within 30 days.`,
          },
          {
            title: "7. Children's Privacy",
            content: `RankUp is intended for adult firefighters and fire service professionals. We do not knowingly collect information from anyone under 18 years of age.`,
          },
          {
            title: "8. Changes to This Policy",
            content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our website or sending an email to your registered address.`,
          },
          {
            title: "9. Contact Us",
            content: `If you have questions about this Privacy Policy, please contact us at privacy@rankupfire.com.`,
          },
        ].map(({ title, content }) => (
          <div key={title} style={{ marginBottom: "40px" }}>
            <h2
              style={{
                fontFamily: "sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                color: "#1B2A4A",
                marginBottom: "12px",
              }}
            >
              {title}
            </h2>
            <p style={{ color: "#444", lineHeight: "1.8", fontSize: "16px" }}>
              {content}
            </p>
          </div>
        ))}
      </div>
      <div
        style={{
          background: "#1B2A4A",
          padding: "24px 48px",
          textAlign: "center",
          fontFamily: "sans-serif",
          fontSize: "13px",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        © 2026 RankUp · rankupfire.com
      </div>
    </div>
  );
}
