"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { shuffleArray } from "@/lib/utils/score";
import type { Question } from "@/types";

type StudyState = "configure" | "session" | "results";

// ── Answer shuffling helpers ──────────────────────────────────────────────────

const OPTION_KEY: Record<string, keyof Question> = {
  A: "answer_a",
  B: "answer_b",
  C: "answer_c",
  D: "answer_d",
};

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash << 5) - hash + i;
    hash |= 0;
    const j = Math.abs(hash) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getDisplayOptions(question: Question) {
  const shuffledKeys = seededShuffle(
    ["A", "B", "C", "D"] as const,
    String(question.id),
  );
  return (["A", "B", "C", "D"] as const).map((displayLabel, i) => ({
    displayLabel,
    originalKey: shuffledKeys[i] as string,
    text: question[OPTION_KEY[shuffledKeys[i]]] as string,
    isCorrect: shuffledKeys[i] === question.correct_answer,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null);
  // Lightweight metadata for building filter UI
  const [meta, setMeta] = useState<{ book_title: string; chapter: any; topic: string | null; difficulty: string | null }[]>([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [sessionQs, setSessionQs] = useState<Question[]>([]);
  const [state, setState] = useState<StudyState>("configure");
  const [results, setResults] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); // stores originalKey
  const [revealed, setRevealed] = useState(false);
  const [book, setBook] = useState("all");
  const [chapter, setChapter] = useState("all");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState(20);
  const [starting, setStarting] = useState(false);
  const [examTypes, setExamTypes] = useState<string[]>([
    "lieutenant",
    "captain",
    "both",
  ]);
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

      // Only show this student's track (plus "both"), so e.g. a captain
      // candidate never sees lieutenant-only books/chapters and vice versa.
      const { data: profile } = await supabase
        .from("profiles")
        .select("exam_type")
        .eq("id", session.user.id)
        .single();
      const types = profile?.exam_type
        ? [profile.exam_type, "both"]
        : ["lieutenant", "captain", "both"];
      setExamTypes(types);

      // Only fetch filter metadata — not full question content.
      // Paginated with .range() because Supabase/PostgREST caps a single
      // unbounded select at 1000 rows by default — without this, books and
      // chapters past row 1000 silently never make it into the dropdowns.
      const all = await fetchAllMeta(types);
      setMeta(all);
      setFilteredCount(all.length);
    };
    init();
  }, []);

  async function fetchAllMeta(types: string[]) {
    const PAGE_SIZE = 1000;
    let all: {
      book_title: string;
      chapter: any;
      topic: string | null;
      difficulty: string | null;
    }[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("questions")
        .select("book_title, chapter, topic, difficulty")
        .eq("is_active", true)
        .eq("study_eligible", true)
        .in("exam_type", types)
        .range(from, from + PAGE_SIZE - 1);
      if (error || !data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return all;
  }

  useEffect(() => {
    let f = meta;
    if (book !== "all") f = f.filter((q) => q.book_title === book);
    if (chapter !== "all") f = f.filter((q) => String(q.chapter) === chapter);
    if (topic !== "all") f = f.filter((q) => String(q.topic) === topic);
    if (difficulty !== "all") f = f.filter((q) => q.difficulty === difficulty);
    setFilteredCount(f.length);
  }, [book, chapter, topic, difficulty, meta]);

  // Natural sort: numeric chapters ascend numerically (so "2" sorts before
  // "10"), suffixed chapters like "26A" sort near their numeric neighbor,
  // and non-numeric values like "N/A" sort last.
  function chapterSort(a: any, b: any) {
    const sa = String(a ?? "");
    const sb = String(b ?? "");
    const na = parseFloat(sa);
    const nb = parseFloat(sb);
    const aNum = !isNaN(na);
    const bNum = !isNaN(nb);
    if (aNum && bNum) return na !== nb ? na - nb : sa.localeCompare(sb);
    if (aNum) return -1;
    if (bNum) return 1;
    return sa.localeCompare(sb);
  }

  const books = [...new Set(meta.map((q) => q.book_title))].sort();
  const chapters = [
    ...new Set(
      meta
        .filter((q) => book === "all" || q.book_title === book)
        .map((q) => q.chapter),
    ),
  ].sort(chapterSort);
  const topics = [
    ...new Set(
      meta
        .filter(
          (q) =>
            (book === "all" || q.book_title === book) &&
            (chapter === "all" || String(q.chapter) === chapter),
        )
        .map((q) => q.topic)
        .filter(Boolean),
    ),
  ].sort((a, b) => String(a).localeCompare(String(b)));

  const startSession = async () => {
    setStarting(true);
    // Fetch only the questions matching current filters — server-side.
    // Paginated for the same reason as fetchAllMeta: an unbounded select
    // can be truncated at 1000 rows when "All books" leaves a large pool.
    const PAGE_SIZE = 1000;
    let all: Question[] = [];
    let from = 0;
    while (true) {
      let query = supabase
        .from("questions")
        .select("*")
        .eq("is_active", true)
        .eq("study_eligible", true)
        .in("exam_type", examTypes)
        .range(from, from + PAGE_SIZE - 1);
      if (book !== "all") query = query.eq("book_title", book);
      if (chapter !== "all") query = query.eq("chapter", chapter);
      if (topic !== "all") query = query.eq("topic", topic);
      if (difficulty !== "all") query = query.eq("difficulty", difficulty);
      const { data, error } = await query;
      if (error || !data || data.length === 0) break;
      all = all.concat(data as Question[]);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    const qs = shuffleArray(all).slice(0, Math.min(count, all.length));
    setStarting(false);
    setSessionQs(qs);
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setResults([]);
    setState("session");
  };

  // selected stores the originalKey (e.g. "B" in DB terms), so comparing
  // directly to correct_answer is always correct regardless of display position.
  const handleNext = () => {
    const correct = selected === currentQ?.correct_answer;
    const newResults = [...results, { q: sessionQs[idx], selected, correct }];
    setResults(newResults);
    if (idx + 1 < sessionQs.length) {
      setIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      const correctCount = newResults.filter((r) => r.correct).length;
      const score = Math.round((correctCount / newResults.length) * 100);
      supabase.from("exam_sessions").insert({
        user_id: user.id,
        mode: "study",
        status: "completed",
        score: correctCount,
        score_percent: score,
        total_questions: newResults.length,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
      setState("results");
    }
  };

  const currentQ = sessionQs[idx];
  // selected is an originalKey, correct_answer is also an originalKey — direct compare works
  const isCorrect = revealed && selected === currentQ?.correct_answer;
  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Firefighter";

  if (!user) return null;

  return (
    <div style={{ display: "flex" }}>
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
                      <option key={c ?? ""} value={c ?? ""}>
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
                    value={topic ?? "all"}
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
                      <option key={t ?? ""} value={t ?? ""}>
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
                  <strong>{Math.min(count, filteredCount)}</strong>
                </div>
                <input
                  type='range'
                  min={5}
                  max={Math.min(50, filteredCount || 50)}
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
                  <span>{Math.min(50, filteredCount || 50)}</span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                {filteredCount} questions match your filters
              </div>
              <button
                onClick={startSession}
                disabled={filteredCount === 0}
                style={{
                  width: "100%",
                  padding: "13px 28px",
                  background: "var(--red)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: filteredCount === 0 || starting ? "not-allowed" : "pointer",
                  opacity: filteredCount === 0 || starting ? 0.7 : 1,
                }}
              >
                {starting ? "Loading questions…" : "Start Study Session"}
              </button>
            </div>
          </>
        )}

        {state === "session" && sessionQs.length > 0 && currentQ && (
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
                {currentQ.book_title} &middot; Ch. {currentQ.chapter}
                {currentQ.topic ? ` · ${currentQ.topic}` : ""}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.55,
                  marginBottom: 24,
                }}
              >
                {currentQ.question_text}
              </div>

              {/* ── Shuffled answer options ── */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {getDisplayOptions(currentQ).map((opt) => {
                  const {
                    displayLabel,
                    originalKey,
                    isCorrect: optCorrect,
                    text,
                  } = opt;
                  const isSelected = selected === originalKey;

                  let border = "var(--border)";
                  let bg = "transparent";

                  if (revealed) {
                    if (optCorrect) {
                      border = "var(--green)";
                      bg = "var(--green-light)";
                    } else if (isSelected && !optCorrect) {
                      border = "var(--red)";
                      bg = "var(--red-light)";
                    }
                  } else if (isSelected) {
                    border = "var(--red)";
                    bg = "var(--red-light)";
                  }

                  return (
                    <div
                      key={displayLabel}
                      onClick={() => !revealed && setSelected(originalKey)}
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
                        {displayLabel}
                      </span>
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>

              {revealed && (
                <div
                  style={{
                    background: isCorrect
                      ? "var(--green-light)"
                      : "var(--red-light)",
                    border: `1px solid ${isCorrect ? "#a9dfbf" : "#f1948a"}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginTop: 16,
                    fontSize: 13.5,
                    color: isCorrect ? "var(--green)" : "var(--red)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>{isCorrect ? "✓ Correct!" : "✗ Incorrect."}</strong>
                  {currentQ.explanation && <span> {currentQ.explanation}</span>}
                  {currentQ.page_start && (
                    <span
                      style={{
                        display: "block",
                        marginTop: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: 0.85,
                      }}
                    >
                      📖 Reference: Page {currentQ.page_start}
                      {currentQ.page_end &&
                      currentQ.page_end !== currentQ.page_start
                        ? `–${currentQ.page_end}`
                        : ""}
                    </span>
                  )}
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
                    {[
                      "#",
                      "Question",
                      "Your Answer",
                      "Correct Answer",
                      "Page Ref",
                      "Result",
                    ].map((h) => (
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
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    // Resolve the display label the user actually clicked
                    const opts = getDisplayOptions(r.q);
                    const selectedOpt = opts.find(
                      (o) => o.originalKey === r.selected,
                    );
                    const correctOpt = opts.find((o) => o.isCorrect);
                    return (
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
                          {r.q.question_text.substring(0, 80)}…
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
                            {selectedOpt ? selectedOpt.displayLabel : "—"}
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
                            {correctOpt
                              ? correctOpt.displayLabel
                              : r.q.correct_answer}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: 12,
                            color: "var(--text-muted)",
                          }}
                        >
                          {r.q.page_start
                            ? `p.${r.q.page_start}${r.q.page_end && r.q.page_end !== r.q.page_start ? `–${r.q.page_end}` : ""}`
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
