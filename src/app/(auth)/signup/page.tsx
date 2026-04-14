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
    <div className='signup-page'>
      <div className='signup-inner'>
        <div className='signup-logo'>
          <div className='signup-logo-img'>
            <Image
              src='/icon.png'
              alt='RankUp'
              width={88}
              height={88}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>
          <div className='signup-logo-title'>RankUp</div>
          <div className='signup-logo-sub'>Create your account</div>
        </div>

        <div className='signup-card'>
          <form onSubmit={handleSubmit}>
            <div className='signup-field'>
              <label className='signup-label'>Full Name</label>
              <input
                type='text'
                required
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder='John Smith'
                className='signup-input'
              />
            </div>

            <div className='signup-field'>
              <label className='signup-label'>Department</label>
              <input
                type='text'
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder='City Fire Dept'
                className='signup-input'
              />
            </div>

            <div className='signup-field'>
              <label className='signup-label'>
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

            <div className='signup-field'>
              <label className='signup-label'>Email</label>
              <input
                type='email'
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder='you@department.gov'
                className='signup-input'
              />
            </div>

            <div className='signup-field-last'>
              <label className='signup-label'>Password</label>
              <input
                type='password'
                required
                minLength={6}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder='min 6 characters'
                className='signup-input'
              />
            </div>

            {error && <div className='signup-error'>{error}</div>}

            <button type='submit' disabled={loading} className='signup-btn'>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className='signup-divider'>
              <div className='signup-divider-line'>
                <div />
              </div>
              <div className='signup-divider-text'>
                <span>Already have an account?</span>
              </div>
            </div>

            <Link href='/login' className='signup-secondary-btn'>
              Sign In
            </Link>
          </form>
        </div>

        <div className='signup-back'>
          <Link href='/'>Back to home</Link>
        </div>
        <p className='signup-disclaimer'>
          Independent study tool. Not affiliated with IFSTA, Fire Protection
          Publications, or any official testing agency.
        </p>
      </div>
    </div>
  );
}
