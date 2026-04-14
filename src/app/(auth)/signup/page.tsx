"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import "./signup.css";
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
        setError("Account created but failed to save exam type.");
        setLoading(false);
        return;
      }
    }
    router.push("/dashboard");
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
          <div className='login-logo-sub'>Create your account</div>
        </div>

        <div className='login-card'>
          <form onSubmit={handleSubmit}>
            <div className='login-field'>
              <label className='login-label'>Full Name</label>
              <input
                type='text'
                required
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder='John Smith'
                className='login-input'
              />
            </div>

            <div className='login-field'>
              <label className='login-label'>Department</label>
              <input
                type='text'
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder='City Fire Dept'
                className='login-input'
              />
            </div>

            <div className='login-field'>
              <label className='login-label'>
                Which exam are you preparing for?
              </label>
              <div className='exam-grid'>
                <button
                  type='button'
                  onClick={() => set("exam_type", "lieutenant")}
                  className={`exam-btn${form.exam_type === "lieutenant" ? " exam-btn-active" : ""}`}
                >
                  🚒 Lieutenant Exam
                </button>
                <button
                  type='button'
                  onClick={() => set("exam_type", "captain")}
                  className={`exam-btn${form.exam_type === "captain" ? " exam-btn-active" : ""}`}
                >
                  👨‍🚒 Captain Exam
                </button>
              </div>
            </div>

            <div className='login-field'>
              <label className='login-label'>Email</label>
              <input
                type='email'
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder='you@department.gov'
                className='login-input'
              />
            </div>

            <div className='login-field-last'>
              <label className='login-label'>Password</label>
              <input
                type='password'
                required
                minLength={6}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder='min 6 characters'
                className='login-input'
              />
            </div>

            {error && <div className='login-error'>{error}</div>}

            <button type='submit' disabled={loading} className='login-btn'>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className='login-divider'>
              <div className='login-divider-line'>
                <div />
              </div>
              <div className='login-divider-text'>
                <span>Already have an account?</span>
              </div>
            </div>

            <Link href='/login' className='login-signup-btn'>
              Sign In
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
