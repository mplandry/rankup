"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, RotateCcw, ChevronRight } from "lucide-react";
import FlashCard from "./FlashCard";

interface Question {
  id: string;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  explanation: string;
  book_title: string;
  chapter: string;
  topic: string;
  page_start: number;
  page_end: number;
  difficulty: string;
}

interface Props {
  questions: Question[];
  progressMap: Record<string, any>;
  userId: string;
  book: string | null;
  chapter: string | null;
}

export default function FlashcardSession({
  questions,
  progressMap,
  userId,
  book,
  chapter,
}: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);

  const total = questions.length;
  const current = questions[index];

  const handleRate = useCallback(
    async (knew: boolean) => {
      if (knew) setCorrect((c) => c + 1);
      else setIncorrect((c) => c + 1);

      // SM-2 spaced repetition algorithm
      const existing = progressMap[current.id];
      const repetitions = knew ? (existing?.repetitions ?? 0) + 1 : 0;
      const easeFactor = Math.max(
        1.3,
        (existing?.ease_factor ?? 2.5) + (knew ? 0.1 : -0.3),
      );
      const intervalDays = knew
        ? repetitions === 1
          ? 1
          : repetitions === 2
            ? 3
            : Math.round((existing?.interval_days ?? 1) * easeFactor)
        : 1;

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + intervalDays);

      await fetch("/api/flashcards/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: current.id,
          knew,
          ease_factor: easeFactor,
          interval_days: intervalDays,
          repetitions,
          next_review_at: nextReview.toISOString(),
        }),
      });

      setFlipped(false);
      setTimeout(() => {
        if (index + 1 >= total) {
          setDone(true);
        } else {
          setIndex((i) => i + 1);
        }
      }, 300);
    },
    [current, index, total, progressMap],
  );

  if (done) {
    return (
      <div className='px-4 py-6 sm:p-8 max-w-2xl mx-auto'>
        <div className='bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center'>
          <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <CheckCircle className='w-8 h-8 text-blue-600' />
          </div>
          <h2 className='text-xl sm:text-2xl font-bold text-[#1B2A4A] mb-2'>
            Session Complete!
          </h2>
          <p className='text-gray-500 mb-6'>You reviewed {total} flashcards</p>
          <div className='flex justify-center gap-6 mb-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>{correct}</div>
              <div className='text-xs text-gray-500'>Knew it</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-500'>{incorrect}</div>
              <div className='text-xs text-gray-500'>Missed</div>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <button
              onClick={() => router.push("/flashcards")}
              className='w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50'
            >
              Back to Flashcards
            </button>
            <button
              onClick={() => {
                setIndex(0);
                setFlipped(false);
                setDone(false);
                setCorrect(0);
                setIncorrect(0);
              }}
              className='w-full sm:w-auto px-6 py-3 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#243660] flex items-center justify-center gap-2'
            >
              <RotateCcw className='w-4 h-4' /> Study Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-4 py-6 sm:p-8 max-w-2xl mx-auto'>
      {/* Progress */}
      <div className='mb-6'>
        <div className='flex items-center justify-between text-sm text-gray-500 mb-2'>
          <span>
            Card {index + 1} of {total}
          </span>
          <div className='flex gap-3'>
            <span className='text-green-600 font-medium'>{correct} ✓</span>
            <span className='text-red-500 font-medium'>{incorrect} ✗</span>
          </div>
        </div>
        <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-blue-500 rounded-full transition-all duration-300'
            style={{ width: `${Math.round((index / total) * 100)}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <FlashCard
        question={current}
        flipped={flipped}
        onFlip={() => setFlipped(true)}
      />

      {/* Rating buttons — only show after flip */}
      {flipped && (
        <div className='mt-4 grid grid-cols-2 gap-3'>
          <button
            onClick={() => handleRate(false)}
            className='flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors'
          >
            <XCircle className='w-5 h-5' /> Missed It
          </button>
          <button
            onClick={() => handleRate(true)}
            className='flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 font-semibold text-sm hover:bg-green-100 transition-colors'
          >
            <CheckCircle className='w-5 h-5' /> Knew It
          </button>
        </div>
      )}

      {!flipped && (
        <button
          onClick={() => setFlipped(true)}
          className='w-full mt-4 bg-[#1B2A4A] hover:bg-[#243660] text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2'
        >
          Reveal Answer <ChevronRight className='w-4 h-4' />
        </button>
      )}
    </div>
  );
}
