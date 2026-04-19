"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import "./login.css";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  return (
    <div className='login-page'>
      <div className='login-inner'>
        <div className='login-logo'>
          <div className='login-logo-img'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={88}
              height={88}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>
          <div className='login-logo-title'>RankUp</div>
          <div className='login-logo-sub'>Sign in to your account</div>
        </div>
        <div className='login-card'>
          <form onSubmit={handleSubmit}>
            <div className='login-field'>
              <label className='login-label'>Email Address</label>
              <input
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@department.gov'
                className='login-input'
              />
            </div>
            <div className='login-field-last'>
              <label className='login-label'>Password</label>
              <input
                type='password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='••••••••'
                className='login-input'
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px', marginBottom: '16px' }}>
              <Link 
                href="/reset-password" 
                style={{ 
                  fontSize: '13px', 
                  color: '#C41E3A', 
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                Forgot password?
              </Link>
            </div>
            {error && <div className='login-error'>{error}</div>}
            <button type='submit' disabled={loading} className='login-btn'>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className='login-divider'>
              <div className='login-divider-line'>
                <div />
              </div>
              <div className='login-divider-text'>
                <span>New here?</span>
              </div>
            </div>
            <Link href='/signup' className='login-signup-btn'>
              Create an Account
            </Link>
          </form>
        </div>
        <div className='login-back'>
          <Link href='/'>Back to home</Link>
        </div>
        <p className='login-disclaimer'>
          Independent study tool. Not affiliated with IFSTA, Fire Protection
          Publications, or any official testing agency.
        </p>
      </div>
    </div>
  );
}
