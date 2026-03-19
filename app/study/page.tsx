"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { shuffleArray } from "@/lib/utils";
import type { Question } from "@/lib/supabase";

type StudyState = "configure" | "session" | "results";

export default function StudyPage() {
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filtered, setFiltered] = useState<Question[]>([]);
  const [sessionQs, setSessionQs] = useState<Question[]>([]);
  const [state, setState] = useState<StudyState>("configure");
  const [results, setResults] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [book, setBook] = useState("all");
  const [chapter, setChapter] = useState("all");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState(20);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
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
        .eq("study_eligible", true);
      setQuestions(data || []);
      setFiltered(data || []);
    };
    init();
  }, []);

  useEffect(() => {
    let f = questions;
    if (book !== "all") f = f.filter((q) => q.book_title === book);
    if (chapter !== "all") f = f.filter((q) => q.chapter === chapter);
    if (topic !== "all") f = f.filter((q) => q.topic === topic);
    if (difficulty !== "all") f = f.filter((q) => q.difficulty === difficulty);
    setFiltered(f);
  }, [book, chapter, topic, difficulty, questions]);

  const books = [...new Set(questions.map((q) => q.book_title))];
  const chapters = [
    ...new Set(
      questions
        .filter((q) => book === "all" || q.book_title === book)
        .map((q) => q.chapter),
    ),
  ];
  const topics = [
    ...new Set(
      questions
        .filter(
          (q) =>
            (book === "all" || q.book_title === book) &&
            (chapter === "all" || q.chapter === chapter),
        )
        .map((q) => q.topic)
        .filter(Boolean),
    ),
  ];

  const startSession = () => {
    const qs = shuffleArray(filtered).slice(
      0,
      Math.min(count, filtered.length),
    );
    setSessionQs(qs);
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setResults([]);
    setState("session");
  };

  const handleNext = () => {
    const correct = selected === sessionQs[idx].correct_answer;
    const newResults = [...results, { q: sessionQs[idx], selected, correct }];
    setResults(newResults);
    if (idx + 1 < sessionQs.length) {
      setIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      // Save session
      const score = Math.round(
        (newResults.filter((r) => r.correct).length / newResults.length) * 100,
      );
      supabase.from("exam_sessions").insert({
        user_id: user.id,
        mode: "study",
        score,
        total_questions: newResults.length,
        completed_at: new Date().toISOString(),
      });
      setState("results");
    }
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Firefighter";

  if (!user) return null;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar userName={userName} userEmail={user?.email || ""} />
      <div
        style={{
          marginLeft: "var(--sidebar-w)",
          flex: 1,
          padding: "36px 40px",
          maxWidth: 1100,
        }}
      >
        {state === "configure" && (
          <>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
              Study Mode
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "var(--text-muted)",
                marginBottom: 28,
              }}
            >
              Practice with instant feedback and chapter references
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
                    background: "var(--green-light)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  📖
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    Configure Study Session
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Filter questions or study the full bank
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Book / Reference
                  </label>
                  <select
                    value={book}
                    onChange={(e) => {
                      setBook(e.target.value);
                      setChapter("all");
                      setTopic("all");
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 13.5,
                    }}
                  >
                    <option value='all'>All books</option>
                    {books.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Chapter
                  </label>
                  <select
                    value={chapter}
                    onChange={(e) => {
                      setChapter(e.target.value);
                      setTopic("all");
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 13.5,
                    }}
                  >
                    <option value='all'>All chapters</option>
                    {chapters.map((c) => (
                      <option key={c} value={c}>
                        Chapter {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Topic
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 13.5,
                    }}
                  >
                    <option value='all'>All topics</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 13.5,
                    }}
                  >
                    <option value='all'>All difficulties</option>
                    <option value='easy'>Easy</option>
                    <option value='medium'>Medium</option>
                    <option value='hard'>Hard</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Number of Questions:{" "}
                  <strong>{Math.min(count, filtered.length)}</strong>
                </div>
                <input
                  type='range'
                  min={5}
                  max={Math.min(50, filtered.length || 50)}
                  value={count}
                  onChange={(e) => setCount(+e.target.value)}
                  style={{ width: "100%", accentColor: "var(--red)" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  <span>5</span>
                  <span>{Math.min(50, filtered.length || 50)}</span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                {filtered.length} questions match your filters
              </div>
              <button
                onClick={startSession}
                disabled={filtered.length === 0}
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
                Start Study Session
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
                <span style={{ fontWeight: 700 }}>Question {idx + 1}</span>{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  of {sessionQs.length}
                </span>
              </div>
              <button
                onClick={() => setState("results")}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                End Session
              </button>
            </div>
            <div
              style={{
                background: "var(--border)",
                borderRadius: 99,
                height: 6,
                marginBottom: 20,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "var(--red)",
                  borderRadius: 99,
                  width: `${(idx / sessionQs.length) * 100}%`,
                  transition: "width 0.3s",
                }}
              />
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
                {sessionQs[idx].book_title} · Ch. {sessionQs[idx].chapter}
                {sessionQs[idx].topic ? ` · ${sessionQs[idx].topic}` : ""}
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
                  let bg = "transparent";
                  let border = "var(--border)";
                  if (revealed) {
                    if (l === sessionQs[idx].correct_answer) {
                      bg = "var(--green-light)";
                      border = "var(--green)";
                    } else if (l === selected) {
                      bg = "var(--red-light)";
                      border = "var(--red)";
                    }
                  } else if (l === selected) {
                    bg = "var(--red-light)";
                    border = "var(--red)";
                  }
                  return (
                    <div
                      key={l}
                      onClick={() => !revealed && setSelected(l)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "13px 16px",
                        border: `2px solid ${border}`,
                        borderRadius: 10,
                        cursor: revealed ? "default" : "pointer",
                        background: bg,
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
              {revealed && (
                <div
                  style={{
                    background:
                      selected === sessionQs[idx].correct_answer
                        ? "var(--green-light)"
                        : "var(--red-light)",
                    border: `1px solid ${selected === sessionQs[idx].correct_answer ? "#a9dfbf" : "#f1948a"}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginTop: 16,
                    fontSize: 13.5,
                    color:
                      selected === sessionQs[idx].correct_answer
                        ? "var(--green)"
                        : "var(--red)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>
                    {selected === sessionQs[idx].correct_answer
                      ? "✓ Correct!"
                      : "✗ Incorrect."}
                  </strong>{" "}
                  {sessionQs[idx].explanation ||
                    `The correct answer is ${sessionQs[idx].correct_answer}.`}
                </div>
              )}
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              {!revealed && (
                <button
                  onClick={() => setRevealed(true)}
                  disabled={!selected}
                  style={{
                    padding: "9px 18px",
                    background: "var(--red)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: !selected ? 0.5 : 1,
                  }}
                >
                  Check Answer
                </button>
              )}
              {revealed && (
                <button
                  onClick={handleNext}
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
                  {idx + 1 < sessionQs.length
                    ? "Next Question →"
                    : "Finish Session"}
                </button>
              )}
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
                  color:
                    results.filter((r) => r.correct).length / results.length >=
                    0.7
                      ? "var(--green)"
                      : "var(--red)",
                  marginBottom: 8,
                }}
              >
                {results.length > 0
                  ? `${Math.round((results.filter((r) => r.correct).length / results.length) * 100)}%`
                  : "—"}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  marginBottom: 20,
                }}
              >
                {results.filter((r) => r.correct).length} of {results.length}{" "}
                correct
              </div>
              <div
                style={{ display: "flex", gap: 10, justifyContent: "center" }}
              >
                <button
                  onClick={() => setState("configure")}
                  style={{
                    padding: "9px 18px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Back to Study Mode
                </button>
                <button
                  onClick={startSession}
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
                  Study Again
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
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13.5,
                          color: "var(--text-muted)",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13.5,
                          maxWidth: 300,
                        }}
                      >
                        {r.q.question_text.substring(0, 80)}…
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            background: "var(--bg)",
                            padding: "3px 8px",
                            borderRadius: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                          }}
                        >
                          {r.selected || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
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
                          {r.q.correct_answer}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {r.correct ? (
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
    </div>
  );
}
