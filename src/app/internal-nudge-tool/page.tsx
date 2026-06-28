"use client";

// One-off internal utility page for manually triggering the trial-nudge
// email for a single student via /api/admin/nudge-student. Not linked from
// anywhere in the app nav; protected by the ADMIN_NUDGE_SECRET / WEBHOOK_SECRET
// check on the API route itself.

import { useState } from "react";

export default function NudgeTool() {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/nudge-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, secret }),
      });
      const data = await res.json();
      setResult(JSON.stringify({ status: res.status, ...data }, null, 2));
    } catch (err) {
      setResult(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", fontFamily: "monospace" }}>
      <h1>Manual Nudge Tool</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Student email
            <br />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              autoComplete="off"
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Admin secret
            <br />
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              autoComplete="off"
            />
          </label>
        </div>
        <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Sending..." : "Send Nudge"}
        </button>
      </form>
      {result && (
        <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>{result}</pre>
      )}
    </div>
  );
}
