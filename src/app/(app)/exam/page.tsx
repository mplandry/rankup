"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/layout/TopNav";
import { shuffleArray, formatTime } from "@/lib/utils/score";
import type { Question } from "@/types";

type ExamState = "configure" | "session" | "results";

export default function ExamPage() {
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionQs, setSessionQs] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [state, setState] = useState<ExamState>("configure");
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [score, setScore] = useState(0);
  const timerRef = useRef<any>(null);
  const sessionQsRef = useRef<Question[]>([]);
  const answersRef = useRef<Record<number, string>>({});
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("is_active", true)
        .eq("exam_eligible", true);
      setQuestions(data || []);
    };
    init();
  }, [router]);

  const handleSubmit = useCallback(async () => {
    clearInterval(timerRef.current);
    const qs = sessionQsRef.current;
    const ans = answersRef.current;
    const correct = qs.filter((q, i) => ans[i] === q.correct_answer).length;
    const finalScore = Math.round((correct / qs.length) * 100);
    setScore(finalScore);
    setState("results");

    const supabase = createClient();
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (authSession) {
      await supabase.from("exam_sessions").insert({
        user_id: authSession.user.id,
        mode: "exam",
        score: finalScore,
        total_questions: qs.length,
        completed_at: new Date().toISOString(),
      });
    }
  }, []);

  const startExam = () => {
    const qs = shuffleArray(questions).slice(0, Math.min(90, questions.length));
    sessionQsRef.current = qs;
    answersRef.current = {};
    setSessionQs(qs);
    setAnswers({});
    setIdx(0);
    setTimeLeft(90 * 60);
    setState("session");

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleAnswer = (letter: string) => {
    const newAnswers = { ...answersRef.current, [idx]: letter };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Firefighter";
  if (!user) return null;

  return (
    <>
      <TopNav role='admin' fullName={userName} email={user?.email || ""} />
      <div style={{ padding: "36px 40px", maxWidth: 1100, margin: "0 auto" }}>
        {state === "configure" && (
          <>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
              Exam Mode
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "var(--text-muted)",
                marginBottom: 28,
              }}
            >
              Simulate the real promotional exam
            </div>
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: "var(--red-light)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  🔥
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    Promotional Exam Simulation
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Just like the real thing
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 14 }}>
                  <strong>90 questions</strong> drawn from the full question
                  bank
                </div>
                <div style={{ fontSize: 14 }}>
                  <strong>1:30:00</strong> time limit &mdash; exam auto-submits
                  when time expires
                </div>
                <div style={{ fontSize: 14 }}>
                  No feedback during the exam &mdash; results shown after
                  submission
                </div>
                <div style={{ fontSize: 14 }}>
                  Passing score: <strong>70%</strong> or higher
                </div>
              </div>
              <div
                style={{
                  background: "var(--green-light)",
                  border: "1px solid #a9dfbf",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 13.5,
                  color: "var(--green)",
                  fontWeight: 600,
                }}
              >
                {questions.length} exam-eligible questions available
              </div>
              <button
                onClick={startExam}
                disabled={questions.length < 10}
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
                }}
              >
                Start Exam
              </button>
            </div>
          </>
        )}

        {state === "session" && sessionQs.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <span style={{ fontWeight: 700 }}>Question {idx + 1}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {" "}
                  of {sessionQs.length}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: timeLeft < 300 ? "#e74c3c" : "var(--red)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatTime(timeLeft)}
                </span>
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: "6px 12px",
                    background: "var(--red)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Submit Exam
                </button>
              </div>
            </div>
            <div
              style={{
                background: "var(--border)",
                borderRadius: 99,
                height: 6,
                marginBottom: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "var(--red)",
                  borderRadius: 99,
                  width: `${(Object.keys(answers).length / sessionQs.length) * 100}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 20,
              }}
            >
              {Object.keys(answers).length} of {sessionQs.length} answered
            </div>
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 32,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 10,
                }}
              >
                {sessionQs[idx].book_title} &middot; Ch.{" "}
                {sessionQs[idx].chapter}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.55,
                  marginBottom: 24,
                }}
              >
                {sessionQs[idx].question_text}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {(["A", "B", "C", "D"] as const).map((l) => {
                  const answerKey =
                    `answer_${l.toLowerCase()}` as keyof Question;
                  const isSelected = answers[idx] === l;
                  return (
                    <div
                      key={l}
                      onClick={() => handleAnswer(l)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "13px 16px",
                        border: `2px solid ${isSelected ? "var(--red)" : "var(--border)"}`,
                        borderRadius: 10,
                        cursor: "pointer",
                        background: isSelected
                          ? "var(--red-light)"
                          : "transparent",
                        fontSize: 14,
                        lineHeight: 1.4,
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          border: "2px solid currentColor",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {l}
                      </span>
                      <span>{sessionQs[idx][answerKey] as string}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setIdx((i) => i - 1)}
                disabled={idx === 0}
                style={{
                  padding: "9px 18px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: idx === 0 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setIdx((i) => i + 1)}
                disabled={idx === sessionQs.length - 1}
                style={{
                  padding: "9px 18px",
                  background: "var(--red)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: idx === sessionQs.length - 1 ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          </>
        )}

        {state === "results" && (
          <>
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 40,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 800,
                  color: score >= 70 ? "var(--green)" : "var(--red)",
                  marginBottom: 8,
                }}
              >
                {score}%
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  marginBottom: 12,
                }}
              >
                {
                  sessionQs.filter((q, i) => answers[i] === q.correct_answer)
                    .length
                }{" "}
                of {sessionQs.length} correct
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 16px",
                  borderRadius: 99,
                  fontWeight: 700,
                  fontSize: 14,
                  background:
                    score >= 70 ? "var(--green-light)" : "var(--red-light)",
                  color: score >= 70 ? "var(--green)" : "var(--red)",
                  marginBottom: 24,
                }}
              >
                {score >= 70 ? "PASSED" : "FAILED"} &mdash; Passing score is 70%
              </span>
              <div>
                <button
                  onClick={() => setState("configure")}
                  style={{
                    padding: "9px 18px",
                    background: "var(--red)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Back to Exam Mode
                </button>
              </div>
            </div>
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafbfc" }}>
                    {["#", "Question", "Your Answer", "Correct", "Result"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sessionQs.map((q, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13.5,
                          color: "var(--text-muted)",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13.5,
                          maxWidth: 300,
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {q.question_text.substring(0, 80)}…
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <span
                          style={{
                            background: "var(--bg)",
                            padding: "3px 8px",
                            borderRadius: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                          }}
                        >
                          {answers[i] || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <span
                          style={{
                            background: "var(--green-light)",
                            color: "var(--green)",
                            padding: "3px 8px",
                            borderRadius: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                          }}
                        >
                          {q.correct_answer}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {answers[i] === q.correct_answer ? (
                          <span
                            style={{ color: "var(--green)", fontWeight: 700 }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            style={{ color: "var(--red)", fontWeight: 700 }}
                          >
                            ✗
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
