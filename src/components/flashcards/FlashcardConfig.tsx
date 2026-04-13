"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, BookOpen } from "lucide-react";

interface Props {
  books: string[];
  bookChapters: Record<string, string[]>;
  userId: string;
}

export default function FlashcardConfig({ books, bookChapters }: Props) {
  const router = useRouter();
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");

  const filteredChapters = book ? bookChapters[book] || [] : [];
  const isMassLaw = book === "Massachusetts General Laws Chapter 148";

  function handleStart(dueOnly: boolean) {
    if (dueOnly) {
      router.push("/flashcards/due");
      return;
    }
    const bookPart = book ? encodeURIComponent(book) : "all";
    const chapterPart = chapter ? encodeURIComponent(chapter) : "none";
    router.push(`/flashcards/${bookPart}__${chapterPart}`);
  }

  return (
    <div className='space-y-4'>
      {/* Due cards CTA */}
      <button
        onClick={() => handleStart(true)}
        className='w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2'
      >
        <Layers className='w-5 h-5' />
        Study Due Cards
      </button>

      <div className='bg-white border border-gray-200 rounded-xl p-6 sm:p-8 space-y-6'>
        <div className='flex items-center gap-3 pb-4 border-b border-gray-100'>
          <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
            <BookOpen className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <div className='font-semibold text-[#1B2A4A]'>
              Browse Flashcards
            </div>
            <div className='text-sm text-gray-500'>
              Filter by book or chapter
            </div>
          </div>
        </div>

        {/* Book Selection */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Book / Reference
          </label>
          <div className='flex flex-col gap-2'>
            <button
              onClick={() => {
                setBook("");
                setChapter("");
              }}
              className={`w-full px-3 py-2.5 rounded-lg text-sm text-left border transition-all ${!book ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              All books
            </button>
            {books.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBook(b);
                  setChapter("");
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm text-left border transition-all ${book === b ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter/Section Selection */}
        {filteredChapters.length > 0 && (
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {isMassLaw ? "Section" : "Chapter"}
            </label>
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={() => setChapter("")}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${!chapter ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                All
              </button>
              {filteredChapters.map((c) => (
                <button
                  key={c}
                  onClick={() => setChapter(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${chapter === c ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  {isMassLaw ? `Sec. ${c}` : `Ch. ${c}`}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => handleStart(false)}
          className='w-full bg-[#1B2A4A] hover:bg-[#243660] text-white font-semibold py-3 rounded-lg transition-colors'
        >
          Start Flashcards
        </button>
      </div>
    </div>
  );
}
