"use client";

import Link from "next/link";
import type { WeakArea } from "@/types";

interface Props {
  items: WeakArea[];
  labelKey: "chapter" | "topic";
}

export default function WeakAreasChart({ items, labelKey }: Props) {
  return (
    <div className='space-y-3'>
      {items.map((item, i) => {
        const label =
          labelKey === "chapter"
            ? `Ch. ${item.chapter}`
            : item.topic || "Unknown";
        const bookLabel = item.book_title || "";
        const pct = item.pct ?? 0;
        const attempts = item.attempts ?? 0;
        const correct = item.correct ?? 0;
        const incorrect = attempts - correct;

        const barColor =
          pct >= 70
            ? "bg-green-500"
            : pct >= 50
              ? "bg-yellow-500"
              : "bg-red-500";
        const textColor =
          pct >= 70
            ? "text-green-600"
            : pct >= 50
              ? "text-yellow-600"
              : "text-red-600";

        const studyHref =
          labelKey === "chapter" && item.book_title && item.chapter
            ? `/study?book=${encodeURIComponent(item.book_title)}&chapter=${encodeURIComponent(item.chapter)}`
            : `/study`;

        return (
          <div
            key={i}
            className='border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all'
          >
            <div className='flex items-start justify-between gap-3 mb-2'>
              <div className='min-w-0'>
                <div className='font-semibold text-[#1B2A4A] text-sm'>
                  {label}
                </div>
                {bookLabel && (
                  <div className='text-xs text-gray-400 truncate mt-0.5'>
                    {bookLabel}
                  </div>
                )}
              </div>
              <div className={`text-lg font-bold shrink-0 ${textColor}`}>
                {pct}%
              </div>
            </div>

            {/* Progress bar */}
            <div className='h-2 bg-gray-100 rounded-full overflow-hidden mb-2'>
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Stats row */}
            <div className='flex items-center justify-between'>
              <div className='flex gap-3 text-xs text-gray-500'>
                <span>{attempts} answered</span>
                <span className='text-green-600'>{correct} correct</span>
                <span className='text-red-500'>{incorrect} incorrect</span>
              </div>
              {labelKey === "chapter" && (
                <Link
                  href={studyHref}
                  className='text-xs font-medium text-[#C0392B] hover:underline shrink-0'
                >
                  Study this →
                </Link>
              )}
            </div>

            {/* Warning if below 70% */}
            {pct < 70 && (
              <div className='mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5'>
                Below passing threshold — needs improvement
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
