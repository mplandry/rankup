"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, department },
          },
        });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 40,
          width: "100%",
          maxWidth: 420,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              background: "var(--red)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔥
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>RankUp</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Fire Promo Prep
            </div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          {isSignUp ? "Create your account" : "Welcome back"}
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginBottom: 24,
          }}
        >
          {isSignUp
            ? "Start preparing for your promotional exam"
            : "Sign in to continue your exam prep"}
        </div>

        {isSignUp && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Full Name
              </label>
              <input
                type='text'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='Lt. John Smith'
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13.5,
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Department
              </label>
              <input
                type='text'
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder='Boston Fire Department'
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13.5,
                }}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            Email
          </label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@firestation.com'
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13.5,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            Password
          </label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='••••••••'
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13.5,
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
        </div>

        {error && (
          <div
            style={{
              background: "var(--red-light)",
              border: "1px solid #f1948a",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: "var(--red)",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 28px",
            background: "var(--red)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
        </button>

        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-muted)",
            marginTop: 16,
          }}
        >
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <span
            onClick={() => setIsSignUp((s) => !s)}
            style={{ color: "var(--red)", cursor: "pointer", fontWeight: 600 }}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </span>
        </div>
      </div>
    </div>
  );
}
