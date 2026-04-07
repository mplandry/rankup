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
type Result = { q: Question; selected: string | null; correct: boolean; correctLetter: string };

export default function StudyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [studyState, setStudyState] = useState<StudyState>("configure");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [books, setBooks] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState("All");
  const [selectedChapter, setSelectedChapter] = useState("All");
  const [count, setCount] = useState(20);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const shuffledAnswers = useMemo(() =>
    questions.map(q => shuffleAnswers({ a: q.answer_a, b: q.answer_b, c: q.answer_c, d: q.answer_d }, q.correct_answer)),
    [questions]
  );

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);
      const { data } = await supabase.from("questions").select("*").eq("study_eligible", true).eq("is_active", true);
      if (data) {
        setAllQuestions(data);
        setBooks(["All", ...Array.from(new Set(data.map(q => q.book_title))).sort()]);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const filtered = selectedBook === "All" ? allQuestions : allQuestions.filter(q => q.book_title === selectedBook);
    setChapters(["All", ...Array.from(new Set(filtered.map(q => String(q.chapter)))).sort()]);
    setSelectedChapter("All");
  }, [selectedBook, allQuestions]);

  const startStudy = () => {
    let pool = allQuestions;
    if (selectedBook !== "All") pool = pool.filter(q => q.book_title === selectedBook);
    if (selectedChapter !== "All") pool = pool.filter(q => String(q.chapter) === selectedChapter);
    const selected = shuffleArray(pool).slice(0, count);
    setQuestions(selected);
    setResults([]);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setStudyState("session");
  };

  const handleAnswer = (letter: string) => {
    if (revealed) return;
    setSelected(letter);
    setRevealed(true);
    const q = questions[current];
    const s = shuffledAnswers[current];
    setResults(r => [...r, { q, selected: letter, correct: letter === s.correctLetter, correctLetter: s.correctLetter }]);
  };

  const handleNext = async () => {
    if (current >= questions.length - 1) {
      const correct = results.filter(r => r.correct).length;
      const score = Math.round((correct / questions.length) * 100);
      await supabase.from("exam_sessions").insert({
        user_id: user?.id, mode: "study", score, total_questions: questions.length,
        completed_at: new Date().toISOString(), time_taken: 0,
      });
      setStudyState("results");
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Loading...</div>;

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Firefighter";

  if (studyState === "configure") return (
    <div style={{ display: "flex" }}>
      <Sidebar userName={userName} userEmail={user?.email || ""} />
      <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 700 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Study Mode</div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 28 }}>Practice with instant feedback on every question.</div>
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 32px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Book</label>
            <select value={selectedBook} onChange={e => setSelectedBook(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--white)" }}>
              {books.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Chapter</label>
            <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--white)" }}>
              {chapters.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Number of Questions: {count}</label>
            <input type="range" min={5} max={50} step={5} value={count} onChange={e => setCount(Number(e.target.value))}
              style={{ width: "100%" }} />
          </div>
          <button onClick={startStudy}
            style={{ width: "100%", padding: "14px", background: "var(--green, #22c55e)", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Start Studying
          </button>
        </div>
      </div>
    </div>
  );

  if (studyState === "results") {
    const correct = results.filter(r => r.correct).length;
    const score = Math.round((correct / results.length) * 100);
    return (
      <div style={{ display: "flex" }}>
        <Sidebar userName={userName} userEmail={user?.email || ""} />
        <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 800 }}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 28 }}>Session Complete!</div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px", textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: score >= 70 ? "var(--green)" : "var(--red)" }}>{score}%</div>
            <div style={{ fontSize: 15, color: "var(--text-muted)" }}>{correct} of {results.length} correct</div>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            <button onClick={() => setStudyState("configure")} style={{ flex: 1, padding: "12px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Study Again</button>
            <button onClick={() => router.push("/progress")} style={{ flex: 1, padding: "12px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>View Progress</button>
          </div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {results.map((r, i) => (
              <div key={i} style={{ padding: "14px 20px", borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{r.correct ? "✅" : "❌"}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{r.q.question_text}</div>
                  {!r.correct && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Correct: {r.correctLetter} — {r.q[`answer_${r.correctLetter.toLowerCase()}` as keyof Question] as string}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const s = shuffledAnswers[current];

  return (
    <div style={{ display: "flex" }}>
      <Sidebar userName={userName} userEmail={user?.email || ""} />
      <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "24px 40px", maxWidth: 900 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Question {current + 1} of {questions.length}</div>
          <button onClick={() => setStudyState("configure")} style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>✕ Exit</button>
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 24 }}>
          <div style={{ height: "100%", width: `${((current + 1) / questions.length) * 100}%`, background: "var(--green, #22c55e)", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 32px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{q.book_title} · Ch. {q.chapter}</div>
          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6 }}>{q.question_text}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {s?.choices.map(choice => {
            const isSelected = selected === choice.letter;
            const isCorrect = choice.letter === s.correctLetter;
            const bg = !revealed ? (isSelected ? "var(--blue-light)" : "var(--white)") : isCorrect ? "var(--green-light, #dcfce7)" : isSelected ? "var(--red-light)" : "var(--white)";
            const border = !revealed ? (isSelected ? "var(--blue)" : "var(--border)") : isCorrect ? "var(--green)" : isSelected ? "var(--red)" : "var(--border)";
            return (
              <div key={choice.letter} onClick={() => handleAnswer(choice.letter)}
                style={{ padding: "14px 20px", background: bg, border: `1.5px solid ${border}`, borderRadius: 10, cursor: revealed ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: !revealed ? (isSelected ? "var(--blue)" : "var(--border)") : isCorrect ? "var(--green)" : isSelected ? "var(--red)" : "var(--border)", color: (isSelected || (revealed && isCorrect)) ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{choice.letter}</span>
                <span style={{ fontSize: 14 }}>{choice.text}</span>
                {revealed && isCorrect && <span style={{ marginLeft: "auto", fontSize: 18 }}>✓</span>}
                {revealed && isSelected && !isCorrect && <span style={{ marginLeft: "auto", fontSize: 18 }}>✗</span>}
              </div>
            );
          })}
        </div>
        {revealed && q.explanation && (
          <div style={{ background: "var(--blue-light, #eff6ff)", border: "1px solid var(--blue)", borderRadius: 10, padding: "14px 18px", marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700 }}>💡 Explanation: </span>{q.explanation}
          </div>
        )}
        {revealed && (
          <button onClick={handleNext} style={{ padding: "12px 28px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {current >= questions.length - 1 ? "Finish Session" : "Next Question →"}
          </button>
        )}
      </div>
    </div>
  );
}
