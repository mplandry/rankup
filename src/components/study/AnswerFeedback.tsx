import type { Question, Answer } from "@/types";
import { CheckCircle2, XCircle, BookOpen, FileText } from "lucide-react";

interface Props {
  question: Question;
  selectedAnswer: Answer;
}

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

const LABELS: Answer[] = ["A", "B", "C", "D"];

export default function AnswerFeedback({ question, selectedAnswer }: Props) {
  const shuffledKeys = seededShuffle(
    ["A", "B", "C", "D"] as Answer[],
    String(question.id)
  );

  const correctDisplayLabel = LABELS[shuffledKeys.indexOf(question.correct_answer as Answer)];
  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div
      className={`rounded-xl border-2 p-4 sm:p-5 ${
        isCorrect ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"
      }`}
    >
      <div className='flex items-center gap-2 mb-3'>
        {isCorrect ? (
          <>
            <CheckCircle2 className='w-5 h-5 text-green-600 shrink-0' />
            <span className='font-semibold text-green-700'>Correct!</span>
          </>
        ) : (
          <>
            <XCircle className='w-5 h-5 text-red-500 shrink-0' />
            <span className='font-semibold text-red-700'>
              Incorrect — correct answer: <strong>{correctDisplayLabel}</strong>
            </span>
          </>
        )}
      </div>

      {question.explanation && (
        <p className='text-sm text-gray-700 mb-4 leading-relaxed'>
          {question.explanation}
        </p>
      )}

      <div className='flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-xs text-gray-600'>
        <div className='flex items-center gap-1.5'>
          <BookOpen className='w-3.5 h-3.5 text-gray-400 shrink-0' />
          <span className='font-medium'>{question.book_title}</span>
          {question.edition && (
            <span className='text-gray-400'>({question.edition})</span>
          )}
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='text-gray-400'>Chapter:</span>
          <span className='font-medium'>{question.chapter}</span>
        </div>
        {question.topic && (
          <div className='flex items-center gap-1.5'>
            <span className='text-gray-400'>Topic:</span>
            <span className='font-medium'>{question.topic}</span>
          </div>
        )}
        {(question.page_start || question.page_end) && (
          <div className='flex items-center gap-1.5'>
            <FileText className='w-3.5 h-3.5 text-gray-400 shrink-0' />
            <span>
              p.{question.page_start}
              {question.page_end && question.page_end !== question.page_start
                ? `–${question.page_end}`
                : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
