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
        className='relative w-full transition-transform duration-500'
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "280px",
        }}
      >
        {/* Front */}
        <div
          className='absolute inset-0 bg-white border-2 border-blue-200 rounded-2xl p-6 flex flex-col'
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className='flex items-center justify-between mb-4'>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                question.difficulty === "easy"
                  ? "bg-green-100 text-green-700"
                  : question.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {question.difficulty}
            </span>
            <span className='text-xs text-gray-400'>Tap to reveal</span>
          </div>
          <p className='flex-1 flex items-center text-[#1B2A4A] font-medium text-base sm:text-lg leading-relaxed'>
            {question.question_text}
          </p>
          <div className='mt-4 text-xs text-gray-400 text-center'>
            {question.book_title} · Ch. {question.chapter}
          </div>
        </div>

        {/* Back */}
        <div
          className='absolute inset-0 bg-white border-2 border-green-300 rounded-2xl p-6 flex flex-col'
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className='mb-3'>
            <span className='text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full'>
              Answer {question.correct_answer}
            </span>
          </div>
          <p className='text-[#1B2A4A] font-semibold text-base mb-3'>
            {correctText}
          </p>
          {question.explanation && (
            <p className='text-sm text-gray-600 leading-relaxed flex-1'>
              {question.explanation}
            </p>
          )}
          <div className='mt-4 flex flex-col gap-1 text-xs text-gray-400'>
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
