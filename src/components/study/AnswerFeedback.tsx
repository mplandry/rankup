import type { Question, Answer } from "@/types";
import { CheckCircle2, XCircle, BookOpen, FileText } from "lucide-react";

interface Props {
  question: Question;
  selectedAnswer: Answer;
}

export default function AnswerFeedback({ question, selectedAnswer }: Props) {
  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div
      className={`rounded-xl border-2 p-4 sm:p-5 ${
        isCorrect ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"
      }`}
    >
      {/* Result header */}
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
              Incorrect — correct answer:{" "}
              <strong>{question.correct_answer}</strong>
            </span>
          </>
        )}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <p className='text-sm text-gray-700 mb-4 leading-relaxed'>
          {question.explanation}
        </p>
      )}

      {/* Reference metadata */}
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
