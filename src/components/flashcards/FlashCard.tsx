"use client";

import { BookOpen, FileText } from "lucide-react";

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
  question: Question;
  flipped: boolean;
  onFlip: () => void;
}

const ANSWER_MAP: Record<string, keyof Question> = {
  A: "answer_a",
  B: "answer_b",
  C: "answer_c",
  D: "answer_d",
};

export default function FlashCard({ question, flipped, onFlip }: Props) {
  const correctText = question[ANSWER_MAP[question.correct_answer]] as string;

  return (
    <div
      className='relative w-full cursor-pointer'
      style={{ perspective: "1000px" }}
      onClick={!flipped ? onFlip : undefined}
    >
      <div
        className='relative w-full grid transition-transform duration-500'
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className='[grid-area:1/1] min-h-[280px] w-full bg-white dark:bg-[#111827] border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex flex-col'
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className='flex items-center justify-between mb-4'>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                question.difficulty === "easy"
                  ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                  : question.difficulty === "medium"
                    ? "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400"
                    : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
              }`}
            >
              {question.difficulty}
            </span>
            <span className='text-xs text-gray-400 dark:text-gray-500'>Tap to reveal</span>
          </div>
          <p className='flex-1 flex items-center text-[#1B2A4A] dark:text-[#e2e8f0] font-medium text-base sm:text-lg leading-relaxed'>
            {question.question_text}
          </p>
          <div className='mt-4 text-xs text-gray-400 dark:text-gray-500 text-center'>
            {question.book_title} · Ch. {question.chapter}
          </div>
        </div>

        {/* Back */}
        <div
          className='[grid-area:1/1] min-h-[280px] w-full bg-white dark:bg-[#111827] border-2 border-green-300 dark:border-green-700 rounded-2xl p-6 flex flex-col'
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className='mb-3'>
            <span className='text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-2 py-0.5 rounded-full'>
              ✓ Correct Answer
            </span>
          </div>
          <p className='text-[#1B2A4A] dark:text-[#e2e8f0] font-semibold text-base mb-3'>
            {correctText}
          </p>
          {question.explanation && (
            <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1'>
              {question.explanation}
            </p>
          )}
          <div className='mt-4 flex flex-col gap-1 text-xs text-gray-400 dark:text-gray-500'>
            <div className='flex items-center gap-1.5'>
              <BookOpen className='w-3.5 h-3.5' />
              <span>{question.book_title}</span>
            </div>
            {question.page_start && (
              <div className='flex items-center gap-1.5'>
                <FileText className='w-3.5 h-3.5' />
                <span>
                  p.{question.page_start}
                  {question.page_end &&
                  question.page_end !== question.page_start
                    ? `–${question.page_end}`
                    : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
