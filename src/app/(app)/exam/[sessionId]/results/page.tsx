import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { isPassing } from "@/lib/utils/score";
import type { Question } from "@/types";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function ExamResultsPage({ params }: Props) {
  const supabase = await createClient();

  // Await params (Next.js 15 requirement)
  const { sessionId } = await params;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch session data
  const { data: sessionData } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", session.user.id)
    .single();

  if (!sessionData) {
    redirect("/dashboard");
  }

  // Fetch session questions with details
  const { data: sessionQuestions } = await supabase
    .from("exam_session_questions")
    .select(
      `
      *,
      question:questions(*)
    `,
    )
    .eq("session_id", sessionId);

  const passed = isPassing(sessionData.score);
  const correctCount =
    sessionQuestions?.filter((q: any) => q.is_correct).length || 0;
  const totalQuestions = sessionQuestions?.length || 0;

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='bg-white dark:bg-[#111827] rounded-lg shadow-lg p-8 mb-6'>
          <div className='text-center mb-8'>
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                passed ? "bg-green-100 dark:bg-green-950/40" : "bg-red-100 dark:bg-red-950/40"
              }`}
            >
              {passed ? (
                <Trophy className='w-10 h-10 text-green-600 dark:text-green-400' />
              ) : (
                <RotateCcw className='w-10 h-10 text-red-600 dark:text-red-400' />
              )}
            </div>
            <h1 className='text-3xl font-bold mb-2'>
              {passed ? "Congratulations!" : "Keep Practicing"}
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>
              You scored {sessionData.score}% ({correctCount} out of{" "}
              {totalQuestions} correct)
            </p>
          </div>

          <div className='border-t pt-6'>
            <h2 className='text-xl font-semibold mb-4'>Question Review</h2>
            <div className='space-y-4'>
              {sessionQuestions?.map((sq: any, index: number) => (
                <div
                  key={sq.id}
                  className={`p-4 rounded-lg border ${
                    sq.is_correct
                      ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30"
                      : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    {sq.is_correct ? (
                      <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0' />
                    ) : (
                      <XCircle className='w-5 h-5 text-red-600 dark:text-red-400 mt-1 flex-shrink-0' />
                    )}
                    <div className='flex-1'>
                      <p className='font-medium mb-2'>
                        Question {index + 1}: {sq.question?.question_text}
                      </p>
                      <div className='text-sm space-y-1'>
                        <p>
                          <span className='font-medium'>Your answer:</span>{" "}
                          <span
                            className={
                              sq.is_correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                            }
                          >
                            {sq.user_answer || "Not answered"}
                          </span>
                        </p>
                        {!sq.is_correct && (
                          <p>
                            <span className='font-medium'>Correct answer:</span>{" "}
                            <span className='text-green-700 dark:text-green-400'>
                              {sq.question?.correct_answer}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
