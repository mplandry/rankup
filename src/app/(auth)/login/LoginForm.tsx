"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

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
    <div
      className='min-h-screen flex items-center justify-center px-4'
      style={{
        background:
          "linear-gradient(160deg, #0d1829 0%, #1B2A4A 50%, #0d1829 100%)",
      }}
    >
      {/* Background effects */}
      <div
        className='fixed inset-0 pointer-events-none'
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(255,255,255,0.015) 80px,rgba(255,255,255,0.015) 81px),repeating-linear-gradient(90deg,transparent,transparent 80px,rgba(255,255,255,0.015) 80px,rgba(255,255,255,0.015) 81px)",
        }}
      />
      <div
        className='fixed pointer-events-none'
        style={{
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(192,57,43,0.12) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      <div className='relative z-10 w-full max-w-md'>
        {/* Logo area */}
        <div className='text-center mb-10'>
          <div className='inline-flex w-24 h-24 rounded-3xl overflow-hidden mb-6 shadow-2xl ring-2 ring-white/10'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={96}
              height={96}
              className='object-cover'
            />
          </div>
          <h1 className='text-5xl font-black text-white tracking-tight mb-2'>
            RankUp
          </h1>
          <p className='text-slate-400 text-base'>Sign in to your account</p>
        </div>

        {/* Form card */}
        <div className='bg-white rounded-3xl shadow-2xl p-10'>
          <form onSubmit={handleSubmit}>
            <div className='mb-6'>
              <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2'>
                Email Address
              </label>
              <input
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-red-400 text-gray-900 bg-gray-50 placeholder-gray-300 text-sm transition-all'
                placeholder='you@department.gov'
              />
            </div>

            <div className='mb-8'>
              <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2'>
                Password
              </label>
              <input
                type='password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-red-400 text-gray-900 bg-gray-50 placeholder-gray-300 text-sm transition-all'
                placeholder='••••••••'
              />
            </div>

            {error && (
              <div className='mb-6 bg-red-50 border-2 border-red-100 text-red-600 text-sm rounded-2xl px-5 py-4'>
                {error}
              </div>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-60 text-base tracking-wide shadow-lg mb-4'
              style={{
                background: "linear-gradient(135deg, #C0392B, #96281B)",
                boxShadow: "0 8px 24px rgba(192,57,43,0.35)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t-2 border-gray-100'></div>
              </div>
              <div className='relative flex justify-center'>
                <span className='px-4 bg-white text-xs font-semibold text-gray-300 uppercase tracking-widest'>
                  New here?
                </span>
              </div>
            </div>

            <Link
              href='/signup'
              className='block w-full text-center py-4 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-bold hover:border-gray-300 hover:bg-gray-50 transition-all tracking-wide'
            >
              Create an Account
            </Link>
          </form>
        </div>

        {/* Back link */}
        <div className='text-center mt-8'>
          <Link
            href='/'
            className='text-slate-500 text-sm hover:text-slate-300 transition-colors'
          >
            ← Back to home
          </Link>
        </div>

        {/* Disclaimer */}
        <p className='text-center text-xs text-slate-600 mt-6 px-4 leading-relaxed'>
          Independent study tool. Not affiliated with IFSTA, Fire Protection
          Publications, or any official testing agency.
        </p>
      </div>
    </div>
  );
}
