"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { shuffleArray, shuffleAnswers, formatTime } from "@/lib/utils";
import type { Question } from "@/lib/supabase";

type ExamState = "configure" | "session" | "results";

export default function ExamPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionQs, setSessionQs] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [state, setState] = useState<ExamState>("configure");
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionQsRef = useRef<Question[]>([]);
  const answersRef = useRef<Record<number, string>>({});
  const correctLettersRef = useRef<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      setUserRole(profile?.role || "student");

      const { data } = await supabase.from("questions").select("*").eq("is_active", true).eq("exam_eligible", true);
      setQuestions(data || []);
    };
    init();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const qs = sessionQsRef.current;
    const ans = answersRef.current;
    const correctLetters = correctLettersRef.current;
    let correct = 0;
    qs.forEach((_, i) => { if (ans[i] === correctLetters[i]) correct++; });
    const pct = Math.round((correct / qs.length) * 100);
    setScore(pct);

    if (user) {
      await supabase.from("exam_sessions").insert({
        user_id: user.id,
        mode: "exam",
        score: pct,
        total_questions: qs.length,
        completed_at: new Date().toISOString(),
        time_taken: 90 * 60 - timeLeft,
      });
    }
    setState("results");
  }, [user, timeLeft]);

  const startExam = () => {
    const pool = shuffleArray([...questions]).slice(0, 90);
    const shuffled = pool.map(q => shuffleAnswers(q));
    correctLettersRef.current = shuffled.map(sq => sq.correctLetter);
    const qs = shuffled.map(sq => sq.question);
    sessionQsRef.current = qs;
    setSessionQs(qs);
    setAnswers({});
    answersRef.current = {};
    setIdx(0);
    setTimeLeft(90 * 60);
    setState("session");

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleAnswer = (letter: string) => {
    const updated = { ...answersRef.current, [idx]: letter };
    answersRef.current = updated;
    setAnswers(updated);
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Firefighter";
  const q = sessionQs[idx];

  if (state === "configure") {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar userName={userName} userEmail={user?.email || ""} userRole={userRole} />
        <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 700 }}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Exam Mode</div>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 32 }}>Timed simulation — 90 questions, 90 minutes</div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 32px", marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Exam Rules</div>
            {["90 questions selected randomly from the question bank", "90 minute time limit", "Cannot go back to change answers once submitted", "Score of 70% or higher is considered passing", `${questions.length} questions available in the pool`].map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: "var(--red)", fontWeight: 700 }}>•</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
          <button
            onClick={startExam}
            disabled={questions.length < 10}
            style={{ padding: "14px 36px", background: "var(--red)", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: questions.length < 10 ? "not-allowed" : "pointer", opacity: questions.length < 10 ? 0.5 : 1 }}>
            {questions.length < 10 ? "Not enough questions" : "Start Exam"}
          </button>
        </div>
      </div>
    );
  }

  if (state === "session" && q) {
    const answered = Object.keys(answers).length;
    return (
      <div style={{ display: "flex" }}>
        <Sidebar userName={userName} userEmail={user?.email || ""} userRole={userRole} />
        <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 800 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Question {idx + 1} of {sessionQs.length}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: timeLeft < 300 ? "var(--red)" : "var(--foreground)" }}>⏱ {formatTime(timeLeft)}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{answered} answered</div>
          </div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 32px" }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 24, lineHeight: 1.6 }}>{q.question_text}</div>
            {[{ letter: "A", text: q.answer_a }, { letter: "B", text: q.answer_b }, { letter: "C", text: q.answer_c }, { letter: "D", text: q.answer_d }].map(opt => {
              const selected = answers[idx] === opt.letter;
              return (
                <div key={opt.letter} onClick={() => handleAnswer(opt.letter)} style={{ display: "flex", gap: 12, padding: "13px 16px", marginBottom: 10, borderRadius: 8, border: `1px solid ${selected ? "var(--red)" : "var(--border)"}`, background: selected ? "var(--red-light)" : "var(--white)", cursor: "pointer", transition: "all 0.1s" }}>
                  <span style={{ fontWeight: 700, color: selected ? "var(--red)" : "var(--text-muted)", width: 20, flexShrink: 0 }}>{opt.letter}</span>
                  <span style={{ fontSize: 14 }}>{opt.text}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {idx > 0 && <button onClick={() => setIdx(i => i - 1)} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--white)", cursor: "pointer", fontSize: 14 }}>← Back</button>}
            {idx < sessionQs.length - 1
              ? <button onClick={() => setIdx(i => i + 1)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--navy)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Next →</button>
              : <button onClick={handleSubmit} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--red)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Submit Exam</button>
            }
          </div>
        </div>
      </div>
    );
  }

  if (state === "results") {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar userName={userName} userEmail={user?.email || ""} userRole={userRole} />
        <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 700 }}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Exam Complete</div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: score >= 70 ? "var(--green)" : "var(--red)", marginBottom: 8 }}>{score}%</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: score >= 70 ? "var(--green)" : "var(--red)" }}>{score >= 70 ? "✓ Passing Score" : "✗ Below Passing"}</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Passing threshold: 70%</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { setState("configure"); setSessionQs([]); setAnswers({}); }} style={{ padding: "12px 28px", background: "var(--red)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Try Again</button>
            <button onClick={() => router.push("/progress")} style={{ padding: "12px 28px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>View Progress</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
