"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
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
      router.push(`/study/${data.session_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");