import Link from "next/link";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p
          style={{
            color: "#888",
            fontSize: "14px",
            marginBottom: "48px",
            fontFamily: "sans-serif",
          }}
        >
          Last updated: May 7, 2026
        </p>

        {[
          {
            title: "1. Agreement to Terms",
            content: `By accessing or using RankUp (rankupfire.com), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the service. These terms apply to all users, including firefighters, fire service professionals, and administrators.`,
          },
          {
            title: "2. Description of Service",
            content: `RankUp is an online educational platform designed to help firefighters prepare for promotional exams (Lieutenant and Captain levels). The service includes practice questions, study sessions, exam simulations, progress tracking, and related educational content. We reserve the right to modify, suspend, or discontinue any part of the service at any time.`,
          },
          {
            title: "3. User Accounts",
            content: `To use RankUp, you must create an account with accurate information including your name, email, fire department, and exam type. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use. You must be at least 18 years old to create an account.`,
          },
          {
            title: "4. Acceptable Use",
            content: `You agree to use RankUp only for lawful purposes and in accordance with these terms. You may not: (a) share your account with others, (b) attempt to circumvent any security features, (c) use automated systems to access the service, (d) copy, distribute, or modify our content without permission, (e) use the service to cheat on actual promotional exams, or (f) interfere with other users' access to the service.`,
          },
          {
            title: "5. Intellectual Property",
            content: `All content on RankUp, including questions, explanations, software, graphics, and trademarks, is owned by RankUp or its licensors and protected by copyright and intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without explicit written permission. Your use of the service grants you a limited, non-exclusive, non-transferable license to access the content for personal study purposes only.`,
          },
          {
            title: "6. Payment Terms",
            content: `Some features of RankUp may require payment. If you purchase a subscription, you agree to pay all applicable fees. Subscriptions automatically renew unless canceled before the renewal date. Refunds may be provided at our discretion on a case-by-case basis. We reserve the right to change pricing with 30 days notice to active subscribers.`,
          },
          {
            title: "7. Content Accuracy",
            content: `While we strive to provide accurate and up-to-date exam preparation content, we do not guarantee that all information is current, complete, or error-free. The content is for study purposes only and should not be considered official exam material. We are not responsible for exam results or promotional outcomes. You should always verify information with official sources and your fire department.`,
          },
          {
            title: "8. Limitation of Liability",
            content: `RankUp is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we disclaim all warranties, express or implied. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability to you for any claim is limited to the amount you paid us in the past 12 months.`,
          },
          {
            title: "9. User Content",
            content: `If you submit feedback, suggestions, or other content to RankUp, you grant us a worldwide, royalty-free license to use that content for improving the service. You represent that any content you submit does not violate any third-party rights.`,
          },
          {
            title: "10. Termination",
            content: `We may suspend or terminate your account at any time for violation of these terms or for any other reason. You may cancel your account at any time by contacting us. Upon termination, your right to access the service immediately ceases, but sections of these terms that by their nature should survive will remain in effect.`,
          },
          {
            title: "11. Changes to Terms",
            content: `We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes via email or through the service. Your continued use of RankUp after changes constitutes acceptance of the modified terms.`,
          },
          {
            title: "12. Governing Law",
            content: `These terms are governed by the laws of the United States and the state in which RankUp is operated, without regard to conflict of law provisions. Any disputes will be resolved in the courts of that jurisdiction.`,
          },
          {
            title: "13. Contact Information",
            content: `For questions about these Terms of Service, please contact us at support@rankupfire.com.`,
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
