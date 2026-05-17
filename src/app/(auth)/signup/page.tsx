"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import "../login/login.css";

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
    // Redirect to welcome page instead of dashboard
    router.push("/welcome");
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
              <label className='login-label'>Fire Department</label>
              <select
                required
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className='login-input'
              >
                <option value="">Select your department...</option>
                <option value="Abington">Abington</option>
                <option value="Agawam">Agawam</option>
                <option value="Amesbury">Amesbury</option>
                <option value="Andover">Andover</option>
                <option value="Arlington">Arlington</option>
                <option value="Attleboro">Attleboro</option>
                <option value="Bedford">Bedford</option>
                <option value="Belmont">Belmont</option>
                <option value="Beverly">Beverly</option>
                <option value="Billerica">Billerica</option>
                <option value="Boston">Boston</option>
                <option value="Bourne">Bourne</option>
                <option value="Brockton">Brockton</option>
                <option value="Brookline">Brookline</option>
                <option value="Burlington">Burlington</option>
                <option value="Canton">Canton</option>
                <option value="Chelsea">Chelsea</option>
                <option value="Danvers">Danvers</option>
                <option value="Dedham">Dedham</option>
                <option value="Dracut">Dracut</option>
                <option value="Easthampton">Easthampton</option>
                <option value="Easton">Easton</option>
                <option value="Everett">Everett</option>
                <option value="Fairhaven">Fairhaven</option>
                <option value="Fall River">Fall River</option>
                <option value="Fitchburg">Fitchburg</option>
                <option value="Framingham">Framingham</option>
                <option value="Gardner">Gardner</option>
                <option value="Gloucester">Gloucester</option>
                <option value="Hanover">Hanover</option>
                <option value="Haverhill">Haverhill</option>
                <option value="Hingham">Hingham</option>
                <option value="Holbrook">Holbrook</option>
                <option value="Holyoke">Holyoke</option>
                <option value="Hudson">Hudson</option>
                <option value="Hull">Hull</option>
                <option value="Lawrence">Lawrence</option>
                <option value="Leominster">Leominster</option>
                <option value="Lowell">Lowell</option>
                <option value="Ludlow">Ludlow</option>
                <option value="Lynn">Lynn</option>
                <option value="Malden">Malden</option>
                <option value="Marblehead">Marblehead</option>
                <option value="Marshfield">Marshfield</option>
                <option value="Medford">Medford</option>
                <option value="Melrose">Melrose</option>
                <option value="Methuen">Methuen</option>
                <option value="Milford">Milford</option>
                <option value="Milton">Milton</option>
                <option value="Nahant">Nahant</option>
                <option value="Natick">Natick</option>
                <option value="New Bedford">New Bedford</option>
                <option value="Newburyport">Newburyport</option>
                <option value="Newton">Newton</option>
                <option value="North Reading">North Reading</option>
                <option value="Norton">Norton</option>
                <option value="Pittsfield">Pittsfield</option>
                <option value="Plymouth">Plymouth</option>
                <option value="Quincy">Quincy</option>
                <option value="Randolph">Randolph</option>
                <option value="Revere">Revere</option>
                <option value="Salem">Salem</option>
                <option value="Saugus">Saugus</option>
                <option value="Shrewsbury">Shrewsbury</option>
                <option value="Somerville">Somerville</option>
                <option value="Springfield">Springfield</option>
                <option value="Stoneham">Stoneham</option>
                <option value="Stoughton">Stoughton</option>
                <option value="Taunton">Taunton</option>
                <option value="Tewksbury">Tewksbury</option>
                <option value="Wakefield">Wakefield</option>
                <option value="Waltham">Waltham</option>
                <option value="Watertown">Watertown</option>
                <option value="Westfield">Westfield</option>
                <option value="Weymouth">Weymouth</option>
                <option value="Whitman">Whitman</option>
                <option value="Winchester">Winchester</option>
                <option value="Winthrop">Winthrop</option>
                <option value="Woburn">Woburn</option>
                <option value="Worcester">Worcester</option>
                <option value="Other">Other / Not Listed</option>
              </select>
                className='login-input'
              />
            </div>

            <div className='login-field'>
              <label className='login-label'>
                Which exam are you preparing for?
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "4px",
                }}
              >
                <button
                  type='button'
                  onClick={() => set("exam_type", "lieutenant")}
                  style={{
                    padding: "14px",
                    border:
                      form.exam_type === "lieutenant"
                        ? "2px solid #C0392B"
                        : "2px solid #f3f4f6",
                    borderRadius: "14px",
                    fontSize: "14px",
                    fontWeight: "700",
                    color:
                      form.exam_type === "lieutenant" ? "#C0392B" : "#6b7280",
                    background:
                      form.exam_type === "lieutenant" ? "#fff5f5" : "#f9fafb",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                >
                  Lieutenant Exam
                </button>
                <button
                  type='button'
                  onClick={() => set("exam_type", "captain")}
                  style={{
                    padding: "14px",
                    border:
                      form.exam_type === "captain"
                        ? "2px solid #C0392B"
                        : "2px solid #f3f4f6",
                    borderRadius: "14px",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: form.exam_type === "captain" ? "#C0392B" : "#6b7280",
                    background:
                      form.exam_type === "captain" ? "#fff5f5" : "#f9fafb",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                >
                  Captain Exam
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
