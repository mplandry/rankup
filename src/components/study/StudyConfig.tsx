"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { DEFAULT_STUDY_COUNT } from "@/lib/constants";

interface Props {
  books: string[];
  chapters: string[];
  topics: string[];
  bookChapters: Record<string, string[]>;
}

export default function StudyConfig({ books, chapters, topics, bookChapters }: Props) {
  const router = useRouter();
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState(DEFAULT_STUDY_COUNT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredChapters = book ? bookChapters[book] || [] : chapters;

  function handleBookChange(val: string) {
    setBook(val);
    setChapter("");
  }

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "study",
          filters: {
            book_title: book || undefined,
            chapter: chapter || undefined,
            topic: topic || undefined,
            difficulty: difficulty || undefined,
            question_count: count,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start session");
      router.push("/study/" + data.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <div className="font-semibold text-[#1B2A4A]">Configure Study Session</div>
          <div className="text-sm text-gray-500">Filter questions or study the full bank</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Book / Reference</label>
          <select value={book} onChange={(e) => handleBookChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
            <option value="">All books</option>
            {books.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
          <select value={chapter} onChange={(e) => setChapter(e.target.value)}
            size={filteredChapters.length > 0 ? Math.min(filteredChapters.length + 1, 15) : 1}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
            <option value="">All chapters</option>
            {filteredChapters.map((c) => <option key={c} value={c}>Chapter {c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
            <option value="">All topics</option>
            {topics.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Questions: <span className="font-bold text-[#1B2A4A]">{count}</span>
        </label>
        <input type="range" min={5} max={50} value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-red-600" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>5</span><span>50</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <button onClick={handleStart} disabled={loading}
        className="w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</> : "Start Study Session"}
      </button>
    </div>
  );
}
