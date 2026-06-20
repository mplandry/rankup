"use client";

import type { Question, Answer } from "@/types";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";

interface Props {
  question: Question;
  selectedAnswer: Answer | null;
  submitted: boolean;
  onAnswer: (answer: Answer) => void;
  mode: "study" | "exam";
}

const LABELS: Answer[] = ["A", "B", "C", "D"];
const OPTION_KEY: Record<Answer, keyof Question> = {
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

export default function QuestionCard({
  question,
  selectedAnswer,
  submitted,
  onAnswer,
  mode,
}: Props) {
  const shuffledKeys = useMemo(
    () => seededShuffle(["A", "B", "C", "D"] as Answer[], String(question.id)),
    [question.id],
  );

  const displayOptions = LABELS.map((label, i) => ({
    displayLabel: label,
    originalKey: shuffledKeys[i],
    text: question[OPTION_KEY[shuffledKeys[i]]] as string,
    isCorrect: shuffledKeys[i] === question.correct_answer,
  }));

  return (
    <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4'>
      <div className='flex items-center gap-2 mb-4'>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            question.difficulty === "easy" && "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400",
            question.difficulty === "medium" && "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400",
            question.difficulty === "hard" && "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400",
          )}
        >
          {question.difficulty}
        </span>
      </div>

      <p className='text-[#1B2A4A] dark:text-[#e2e8f0] font-medium text-lg leading-relaxed mb-6'>
        {question.question_text}
      </p>

      <div className='space-y-3'>
        {displayOptions.map((opt) => {
          const { displayLabel, originalKey, isCorrect, text } = opt;
          const isSelected = selectedAnswer === originalKey;
          const showResult = submitted && mode === "study";

          let optClass =
            "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer";
          let icon = null;

          if (showResult) {
            if (isCorrect) {
              optClass = "border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default";
              icon = (
                <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-400 shrink-0' />
              );
            } else if (isSelected && !isCorrect) {
              optClass = "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30 cursor-default";
              icon = <XCircle className='w-5 h-5 text-red-500 dark:text-red-400 shrink-0' />;
            } else {
              optClass = "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60 cursor-default";
            }
          } else if (isSelected) {
            optClass = "border-[#1B2A4A] dark:border-gray-400 bg-[#1B2A4A]/5 dark:bg-gray-800 cursor-pointer";
          }

          return (
            <button
              key={displayLabel}
              onClick={() => !submitted && onAnswer(originalKey)}
              disabled={submitted}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all",
                optClass,
              )}
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0",
                  showResult &&
                    isCorrect &&
                    "border-green-500 bg-green-500 text-white",
                  showResult &&
                    isSelected &&
                    !isCorrect &&
                    "border-red-400 dark:border-red-600 bg-red-400 text-white",
                  !showResult &&
                    isSelected &&
                    "border-[#1B2A4A] dark:border-gray-300 bg-[#1B2A4A] dark:bg-gray-300 text-white dark:text-gray-900",
                  !showResult && !isSelected && "border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-400",
                )}
              >
                {displayLabel}
              </span>
              <span className='flex-1 text-sm text-gray-800 dark:text-gray-200'>{text}</span>
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
