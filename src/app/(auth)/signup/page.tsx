"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    department: "",
    email: "",
    password: "",
    exam_type: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");

    if (!form.exam_type) {
      setError("Please select which exam you are preparing for.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, department: form.department },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ exam_type: form.exam_type })
        .eq("id", data.user.id);

      if (profileError) {
        setError(
          "Account created but failed to save exam type. Please update in settings.",
        );
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#1B2A4A]'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex w-20 h-20 rounded-2xl overflow-hidden mb-4'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={80}
              height={80}
              className='object-cover'
            />
          </div>
          <h1 className='text-3xl font-bold text-white'>RankUp</h1>
          <p className='text-slate-400 mt-1'>Create your account</p>
        </div>

        <div className='bg-white rounded-2xl shadow-xl p-8'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Full Name
              </label>
              <input
                type='text'
                required
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
                placeholder='John Smith'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Department
              </label>
              <input
                type='text'
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
                placeholder='City Fire Dept'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Which exam are you preparing for?
              </label>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  type='button'
                  onClick={() => set("exam_type", "lieutenant")}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.exam_type === "lieutenant"
                      ? "border-[#C0392B] bg-red-50 text-[#C0392B]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Lieutenant Exam
                </button>
                <button
                  type='button'
                  onClick={() => set("exam_type", "captain")}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.exam_type === "captain"
                      ? "border-[#C0392B] bg-red-50 text-[#C0392B]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Captain Exam
                </button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Email
              </label>
              <input
                type='email'
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
                placeholder='you@department.gov'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Password
              </label>
              <input
                type='password'
                required
                minLength={6}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
                placeholder='min 6 characters'
              />
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3'>
                {error}
              </div>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60'
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className='text-center text-sm text-gray-500 mt-6'>
            Already have an account?{" "}
            <Link
              href='/login'
              className='text-[#C0392B] font-medium hover:underline'
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className='text-center text-[11px] text-slate-500 mt-6 px-4 leading-relaxed'>
          This app is an independent study tool and is not affiliated with or
          endorsed by IFSTA, Fire Protection Publications, or any official
          testing agency.
        </p>
      </div>
    </div>
  );
}
