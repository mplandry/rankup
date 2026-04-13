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
  bookTopics: Record<string, string[]>;
}

export default function StudyConfig({
  books,
  chapters,
  topics,
  bookChapters,
  bookTopics,
}: Props) {
  const router = useRouter();
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState(DEFAULT_STUDY_COUNT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rawChapters = book ? bookChapters[book] || [] : chapters;
  const filteredChapters = rawChapters.filter(
    (c) => c && c.trim().toUpperCase() !== "N/A",
  );
  const filteredTopics = book ? bookTopics[book] || [] : topics;

  function handleBookChange(val: string) {
    setBook(val);
    setChapter("");
    setTopic("");
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
    <div className='bg-white border border-gray-200 rounded-xl p-8 space-y-6'>
      <div className='flex items-center gap-3 pb-4 border-b border-gray-100'>
        <div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'>
          <BookOpen className='w-5 h-5 text-orange-600' />
        </div>
        <div>
          <div className='font-semibold text-[#1B2A4A]'>
            Configure Study Session
          </div>
          <div className='text-sm text-gray-500'>
            Filter questions or study the full bank
          </div>
        </div>
      </div>

      {/* Book Selection */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Book / Reference
        </label>
        <div className='flex flex-col gap-2'>
          <button
            type='button'
            onClick={() => handleBookChange("")}
            className={`w-full px-3 py-2.5 rounded-lg text-sm text-left border transition-all ${!book ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
          >
            All books
          </button>
          {books.map((b) => (
            <button
              key={b}
              type='button'
              onClick={() => handleBookChange(b)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm text-left border transition-all ${book === b ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Chapter Selection - only show if there are valid chapters */}
      {filteredChapters.length > 0 && (
        <div>
          {/* Chapter/Section Selection - only show if there are valid chapters */}
          {filteredChapters.length > 0 && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {book === "Massachusetts General Laws Chapter 148"
                  ? "Section"
                  : "Chapter"}
              </label>
              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={() => setChapter("")}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${!chapter ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  All
                </button>
                {filteredChapters.map((c) => (
                  <button
                    key={c}
                    type='button'
                    onClick={() => setChapter(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${chapter === c ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {book === "Massachusetts General Laws Chapter 148"
                      ? `Sec. ${c}`
                      : `Ch. ${c}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => setChapter("")}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${!chapter ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              All
            </button>
            {filteredChapters.map((c) => (
              <button
                key={c}
                type='button'
                onClick={() => setChapter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${chapter === c ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                Ch. {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Difficulty
        </label>
        <div className='flex gap-2'>
          {["", "easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              type='button'
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all capitalize ${difficulty === d ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              {d || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Number of Questions */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Number of Questions:{" "}
          <span className='font-bold text-[#1B2A4A]'>{count}</span>
        </label>
        <input
          type='range'
          min={5}
          max={50}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className='w-full accent-red-600'
        />
        <div className='flex justify-between text-xs text-gray-400 mt-1'>
          <span>5</span>
          <span>50</span>
        </div>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3'>
          {error}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={loading}
        className='w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2'
      >
        {loading ? (
          <>
            <Loader2 className='w-4 h-4 animate-spin' /> Starting...
          </>
        ) : (
          "Start Study Session"
        )}
      </button>
    </div>
  );
}
