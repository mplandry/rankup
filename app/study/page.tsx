"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { shuffleArray, shuffleAnswers } from "@/lib/utils";
import type { Question } from "@/lib/supabase";

type StudyState = "configure" | "session" | "results";
type Result = { question: Question; selected: string | null; correct: boolean };

interface SessionQuestion {
  question: Question;
  choices: { letter: "A" | "B" | "C" | "D"; text: string }[];
  correctLetter: "A" | "B" | "C" | "D";
}

export default function StudyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionQs, setSessionQs] = useState<SessionQuestion[]>([]);
  const [state, setState] = useState<StudyState>("configure");
  const [results, setResults] = useState<Result[]>([]);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      setUserRole(profile?.role || "student");
      const { data } = await supabase.from("questions").select("*").eq("is_active", true).eq("study_eligible", true);
      setQuestions(data || []);
    };
    init();
  }, []);

  const books = useMemo(() => ["all", ...Array.from(new Set(questions.map(q => q.book_title))).sort()], [questions]);
  const chapters = useMemo(() => {
    const pool = book === "all" ? questions : questions.filter(q => q.book_title === book);
    return ["all", ...Array.from(new Set(pool.map(q => String(q.chapter)))).sort()];
  }, [questions, book]);
  const topics = useMemo(() => {
    let pool = questions;
    if (book !== "all") pool = pool.filter(q => q.book_title === book);
    if (chapter !== "all") pool = pool.filter(q => String(q.chapter) === chapter);
    return ["all", ...Array.from(new Set(pool.map(q => q.topic).filter(Boolean) as string[])).sort()];
  }, [questions, book, chapter]);

  const filtered = useMemo(() => {
    let pool = questions;
    if (book !== "all") pool = pool.filter(q => q.book_title === book);
    if (chapter !== "all") pool = pool.filter(q => String(q.chapter) === chapter);
    if (topic !== "all") pool = pool.filter(q => q.topic === topic);
    if (difficulty !== "all") pool = pool.filter(q => q.difficulty === difficulty);
    return pool;
  }, [questions, book, chapter, topic, difficulty]);

  const startSession = () => {
    const pool = shuffleArray([...filtered]).slice(0, count);
    const sqs: SessionQuestion[] = pool.map(q => {
      const { choices, correctLetter } = shuffleAnswers(
        { a: q.answer_a, b: q.answer_b, c: q.answer_c, d: q.answer_d },
        q.correct_answer
      );
      return { question: q, choices, correctLetter };
    });
    setSessionQs(sqs);
    setResults([]);
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setState("session");
  };

  const handleNext = () => {
    const sq = sessionQs[idx];
    if (selected !== null) {
      setResults(r => [...r, { question: sq.question, selected, correct: selected === sq.correctLetter }]);
    }
    if (idx < sessionQs.length - 1) {
      setIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      finishSession(selected);
    }
  };

  const finishSession = async (lastSelected: string | null) => {
    const sq = sessionQs[idx];
    const finalResults = lastSelected !== null
      ? [...results, { question: sq.question, selected: lastSelected, correct: lastSelected === sq.correctLetter }]
      : results;
    const correct = finalResults.filter(r => r.correct).length;
    const pct = finalResults.length ? Math.round((correct / finalResults.length) * 100) : 0;
    setResults(finalResults);
    if (user) {
      await supabase.from("exam_sessions").insert({
        user_id: user.id, mode: "study", score: pct,
        total_questions: finalResults.length, completed_at: new Date().toISOString(), time_taken: 0,
      });
    }
    setState("results");
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Firefighter";
  const sq = sessionQs[idx];
  const selectStyle = { padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, background: "var(--white)", color: "var(--foreground)", width: "100%" };

  if (state === "configure") {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar userName={userName} userEmail={user?.email || ""} userRole={userRole} />
        <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 700 }}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Study Mode</div>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 28 }}>Practice with instant feedback and explanations</div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px 28px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Configure Session</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>BOOK</label>
                <select value={book} onChange={e => { setBook(e.target.value); setChapter("all"); setTopic("all"); }} style={selectStyle}>
                  {books.map(b => <option key={b} value={b}>{b === "all" ? "All Books" : b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>CHAPTER</label>
                <select value={chapter} onChange={e => { setChapter(e.target.value); setTopic("all"); }} style={selectStyle}>
                  {chapters.map(c => <option key={c} value={c}>{c === "all" ? "All Chapters" : `Chapter ${c}`}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>TOPIC</label>
                <select value={topic} onChange={e => setTopic(e.target.value)} style={selectStyle}>
                  {topics.map(t => <option key={t} value={t}>{t === "all" ? "All Topics" : t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>DIFFICULTY</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={selectStyle}>
                  {["all", "easy", "medium", "hard"].map(d => <option key={d} value={d}>{d === "all" ? "All Difficulties" : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>NUMBER OF QUESTIONS: {count}</label>
              <input type="range" min={5} max={Math.min(50, Math.max(filtered.length, 5))} value={Math.min(count, Math.max(filtered.length, 5))} onChange={e => setCount(Number(e.target.value))} style={{ width: "100%" }} />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{filtered.length} questions match your filters</div>
            </div>
            <button onClick={startSession} disabled={filtered.length === 0}
              style={{ padding: "12px 28px", background: "var(--red)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: filtered.length === 0 ? "not-allowed" : "pointer", opacity: filtered.length === 0 ? 0.5 : 1 }}>
              Start Session ({Math.min(count, filtered.length)} questions)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "session" && sq) {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar userName={userName} userEmail={user?.email || ""} userRole={userRole} />
        <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 800 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Question {idx + 1} of {sessionQs.length}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{results.filter(r => r.correct).length} correct</div>
          </div>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 24 }}>
            <div style={{ height: 4, background: "var(--red)", borderRadius: 2, width: `${(idx / sessionQs.length) * 100}%`, transition: "width 0.3s" }} />
          </div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 32px" }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 24, lineHeight: 1.6 }}>{sq.question.question_text}</div>
            {sq.choices.map(opt => {
              let bg = "var(--white)", border = "var(--border)", color = "var(--foreground)";
              if (revealed) {
                if (opt.letter === sq.correctLetter) { bg = "var(--green-light)"; border = "var(--green)"; color = "var(--green)"; }
                else if (opt.letter === selected) { bg = "var(--red-light)"; border = "var(--red)"; color = "var(--red)"; }
              } else if (opt.letter === selected) { bg = "var(--red-light)"; border = "var(--red)"; }
              return (
                <div key={opt.letter} onClick={() => !revealed && setSelected(opt.letter)}
                  style={{ display: "flex", gap: 12, padding: "13px 16px", marginBottom: 10, borderRadius: 8, border: `1px solid ${border}`, background: bg, cursor: revealed ? "default" : "pointer", transition: "all 0.15s" }}>
                  <span style={{ fontWeight: 700, color: color === "var(--foreground)" ? "var(--text-muted)" : color, width: 20, flexShrink: 0 }}>{opt.letter}</span>
                  <span style={{ fontSize: 14, color }}>{opt.text}</span>
                </div>
              );
            })}
            {revealed && sq.question.explanation && (
              <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--blue-light)", borderRadius: 8, fontSize: 13, color: "var(--blue)", lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700 }}>Explanation: </span>{sq.question.explanation}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {!revealed && selected !== null && (
              <button onClick={() => setRevealed(true)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--navy)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Check Answer</button>
            )}
            {(revealed || selected === null) && (
              <button onClick={handleNext} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--red)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                {idx < sessionQs.length - 1 ? "Next →" : "Finish"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "results") {
    const correct = results.filter(r => r.correct).length;
    const pct = results.length ? Math.round((correct / results.length) * 100) : 0;
    return (
      <div style={{ display: "flex" }}>
        <Sidebar userName={userName} userEmail={user?.email || ""} userRole={userRole} />
        <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 700 }}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Session Complete</div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: pct >= 70 ? "var(--green)" : "var(--red)", marginBottom: 8 }}>{pct}%</div>
            <div style={{ fontSize: 16, color: "var(--text-muted)" }}>{correct} of {results.length} correct</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { setState("configure"); setSessionQs([]); setResults([]); }}
              style={{ padding: "12px 28px", background: "var(--red)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Study Again</button>
            <button onClick={() => router.push("/progress")}
              style={{ padding: "12px 28px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>View Progress</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
