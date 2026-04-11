"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, ChevronDown } from "lucide-react";
import { DEFAULT_STUDY_COUNT } from "@/lib/constants";

interface Props {
  books: string[];
  chapters: string[];
  topics: string[];
  bookChapters: Record<string, string[]>;
}

export default function StudyConfig({
  books,
  chapters,
  topics,
  bookChapters,
}: Props) {
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
      router.push(`/study/${data.session_id}`);
    } catch (err: unknown) {
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

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <CustomSelect
          label='Book / Reference'
          value={book}
          onChange={handleBookChange}
          placeholder='All books'
          options={books.map((b) => ({ value: b, label: b }))}
        />
        <CustomSelect
          label='Chapter'
          value={chapter}
          onChange={setChapter}
          placeholder='All chapters'
          options={filteredChapters.map((c) => ({
            value: c,
            label: `Chapter ${c}`,
          }))}
        />
        <CustomSelect
          label='Topic'
          value={topic}
          onChange={setTopic}
          placeholder='All topics'
          options={topics.filter(Boolean).map((t) => ({ value: t, label: t }))}
        />
        <CustomSelect
          label='Difficulty'
          value={difficulty}
          onChange={setDifficulty}
          placeholder='All difficulties'
          options={[
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
        />
      </div>

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
            <Loader2 className='w-4 h-4 animate-spin' /> Starting…
          </>
        ) : (
          "Start Study Session"
        )}
      </button>
    </div>
  );
}

function CustomSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className='relative'>
      <label className='block text-sm font-medium text-gray-700 mb-1'>
        {label}
      </label>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white flex items-center justify-between text-left'
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
          <div
            className='px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer'
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-red-50 hover:text-red-700 ${
                value === opt.value
                  ? "bg-red-50 text-red-700 font-medium"
                  : "text-gray-700"
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
