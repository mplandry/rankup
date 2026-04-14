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
      className='min-h-screen flex items-center justify-center relative overflow-hidden'
      style={{
        background:
          "linear-gradient(160deg, #0d1829 0%, #1B2A4A 50%, #0d1829 100%)",
      }}
    >
      {/* Background grid */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(255,255,255,0.015) 80px,rgba(255,255,255,0.015) 81px),repeating-linear-gradient(90deg,transparent,transparent 80px,rgba(255,255,255,0.015) 80px,rgba(255,255,255,0.015) 81px)",
        }}
      />

      {/* Red glow */}
      <div
        className='absolute pointer-events-none'
        style={{
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(192,57,43,0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      <div className='relative z-10 w-full max-w-sm px-6 py-12'>
        {/* Logo */}
        <div className='text-center mb-10'>
          <div className='inline-flex w-20 h-20 rounded-2xl overflow-hidden mb-5 shadow-2xl ring-2 ring-white/10'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={80}
              height={80}
              className='object-cover'
            />
          </div>
          <h1 className='text-4xl font-black text-white tracking-tight'>
            RankUp
          </h1>
          <p className='text-slate-400 mt-2 text-sm'>Sign in to your account</p>
        </div>

        {/* Card */}
        <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div>
              <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>
                Email
              </label>
              <input
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-gray-50 placeholder-gray-400 text-sm transition-all'
                placeholder='you@department.gov'
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>
                Password
              </label>
              <input
                type='password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-gray-50 placeholder-gray-400 text-sm transition-all'
                placeholder='••••••••'
              />
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3'>
                {error}
              </div>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 text-sm tracking-wide shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0'
              style={{
                background: "linear-gradient(135deg, #C0392B, #96281B)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-100'></div>
            </div>
            <div className='relative flex justify-center'>
              <span className='px-3 bg-white text-xs text-gray-400'>
                New here?
              </span>
            </div>
          </div>

          <Link
            href='/signup'
            className='block w-full text-center py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all'
          >
            Create an account
          </Link>
        </div>

        {/* Back to home */}
        <div className='text-center mt-6'>
          <Link
            href='/'
            className='text-slate-500 text-xs hover:text-slate-300 transition-colors'
          >
            ← Back to home
          </Link>
        </div>

        {/* Disclaimer */}
        <p className='text-center text-[10px] text-slate-600 mt-6 px-2 leading-relaxed'>
          This app is an independent study tool and is not affiliated with or
          endorsed by IFSTA, Fire Protection Publications, or any official
          testing agency.
        </p>
      </div>
    </div>
  );
}
