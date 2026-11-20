"use client";

import { useState } from "react";
import { Flag, Check } from "lucide-react";
import type { Answer } from "@/types";

interface Props {
  questionId: string;
  selectedAnswer: Answer | null;
}

export default function ReportQuestion({ questionId, selectedAnswer }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    setState("sending");
    try {
      const res = await fetch("/api/question-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          user_answer: selectedAnswer,
          note,
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="mt-4 flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
        <Check className="w-3.5 h-3.5" />
        Thanks. This question has been flagged for review.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 underline-offset-2 hover:underline"
      >
        <Flag className="w-3.5 h-3.5" />
        Report this question
      </button>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
      <label
        htmlFor={`report-note-${questionId}`}
        className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
      >
        What looks wrong? (optional)
      </label>
      <textarea
        id={`report-note-${questionId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="e.g. The book says B on page 102, not C."
        className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30"
      />
      {state === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Could not send. Please try again.
        </p>
      )}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={submit}
          disabled={state === "sending"}
          className="px-3 py-1.5 bg-[#1B2A4A] hover:bg-[#243660] text-white text-xs font-semibold rounded-lg disabled:opacity-60"
        >
          {state === "sending" ? "Sending..." : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
