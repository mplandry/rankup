"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import type { Question } from "@/types";
// ============================================================================
// CONSTANTS
// ============================================================================

const ITEMS_PER_PAGE = 50;

// ============================================================================
// TYPES
// ============================================================================

interface FilterState {
  bookTitle: string;
  chapter: string;
  difficulty: string;
  studyEligible: string;
  examEligible: string;
  searchText: string;
}

interface AnswerDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
  total: number;
}

// ============================================================================
// CHILD COMPONENTS
// ============================================================================

function AnswerDistributionChart({
  distribution,
}: {
  distribution: AnswerDistribution;
}) {
  const { total } = distribution;

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-7 mb-5'>
      <div className='text-[15px] font-bold mb-1.5'>Answer Distribution</div>
      <div className='text-xs text-gray-500 mb-5'>
        {total} approved questions · target 20–30% each
      </div>
      <div className='grid grid-cols-4 gap-5'>
        {(["A", "B", "C", "D"] as const).map((letter) => {
          const count = distribution[letter];
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={letter}>
              <div className='text-xl font-bold mb-1.5'>{percentage}%</div>
              <div className='h-2 bg-gray-200 rounded-full overflow-hidden mb-2'>
                <div
                  className='h-full bg-blue-500 rounded-full transition-all'
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className='text-[13px] font-bold'>{letter}</div>
              <div className='text-xs text-gray-500'>{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterBar({
  filters,
  bookTitles,
  chapters,
  onFilterChange,
  onClearFilters,
  hasFilters,
}: {
  filters: FilterState;
  bookTitles: string[];
  chapters: string[];
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}) {
  return (
    <>
      <div className='mb-4'>
        <input
          type='text'
          placeholder='Search question text...'
          value={filters.searchText}
          onChange={(e) => onFilterChange("searchText", e.target.value)}
          className='w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm'
        />
      </div>

      <div className='flex gap-3 mb-7 flex-wrap'>
        <select
          value={filters.bookTitle}
          onChange={(e) => onFilterChange("bookTitle", e.target.value)}
          className='flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white'
        >
          <option value=''>All Books</option>
          {bookTitles.map((book) => (
            <option key={book} value={book}>
              {book}
            </option>
          ))}
        </select>

        <select
          value={filters.chapter}
          onChange={(e) => onFilterChange("chapter", e.target.value)}
          className='flex-1 min-w-[150px] px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white'
        >
          <option value=''>All Chapters</option>
          {chapters.map((ch) => (
            <option key={ch} value={ch}>
              Chapter {ch}
            </option>
          ))}
        </select>

        <select
          value={filters.difficulty}
          onChange={(e) => onFilterChange("difficulty", e.target.value)}
          className='flex-1 min-w-[150px] px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white'
        >
          <option value=''>All Difficulties</option>
          <option value='easy'>Easy</option>
          <option value='medium'>Medium</option>
          <option value='hard'>Hard</option>
        </select>

        <select
          value={filters.studyEligible}
          onChange={(e) => onFilterChange("studyEligible", e.target.value)}
          className='flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white'
        >
          <option value=''>Study: All</option>
          <option value='true'>Study: Yes</option>
          <option value='false'>Study: No</option>
        </select>

        <select
          value={filters.examEligible}
          onChange={(e) => onFilterChange("examEligible", e.target.value)}
          className='flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white'
        >
          <option value=''>Exam: All</option>
          <option value='true'>Exam: Yes</option>
          <option value='false'>Exam: No</option>
        </select>

        {hasFilters && (
          <button
            onClick={onClearFilters}
            className='px-4 py-2 bg-transparent border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-600 hover:bg-gray-50'
          >
            Clear Filters
          </button>
        )}
      </div>
    </>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${colors[difficulty as keyof typeof colors]}`}
    >
      {difficulty}
    </span>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className='flex justify-between items-center flex-wrap gap-4'>
      <div className='text-[13px] text-gray-500'>
        Showing {startItem}–{endItem} of {totalCount.toLocaleString()} questions
      </div>

      <div className='flex gap-1.5 flex-wrap'>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className='px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
        >
          First
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
        >
          ← Prev
        </button>

        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className='px-3 py-2 text-gray-400 flex items-center'
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`px-3.5 py-2 border rounded-lg text-[13px] font-semibold ${
                currentPage === page
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
        >
          Next →
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className='px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
        >
          Last
        </button>
      </div>
    </div>
  );
}

function EditModal({
  question,
  onClose,
  onSave,
  saving,
}: {
  question: Question;
  onClose: () => void;
  onSave: (question: Question) => Promise<void>;
  saving: boolean;
}) {
  const [editedQuestion, setEditedQuestion] = useState<Question>(question);

  const updateField = <K extends keyof Question>(
    key: K,
    value: Question[K],
  ) => {
    setEditedQuestion((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5'>
      <div className='bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-8'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <div className='text-xl font-bold'>
              Edit Question #{question.id}
            </div>
            <div className='text-[13px] text-gray-500 mt-1'>
              {question.book_title} · Ch. {question.chapter}
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-2xl leading-none p-2'
          >
            ×
          </button>
        </div>

        {/* Question Text */}
        <div className='mb-5'>
          <label className='block text-[13px] font-semibold mb-1.5'>
            Question Text
          </label>
          <textarea
            value={editedQuestion.question_text}
            onChange={(e) => updateField("question_text", e.target.value)}
            className='w-full px-3 py-3 border border-gray-200 rounded-lg text-sm resize-y min-h-[100px]'
          />
        </div>

        {/* Answer Options */}
        <div className='mb-5'>
          <label className='block text-[13px] font-semibold mb-3'>
            Answer Options
          </label>
          <div className='space-y-3'>
            {(["A", "B", "C", "D"] as const).map((letter) => {
              const key = `answer_${letter.toLowerCase()}` as keyof Question;
              return (
                <div key={letter} className='flex gap-2 items-center'>
                  <input
                    type='radio'
                    checked={editedQuestion.correct_answer === letter}
                    onChange={() => updateField("correct_answer", letter)}
                    className='w-4 h-4 cursor-pointer'
                  />
                  <span className='font-bold w-5'>{letter}.</span>
                  <input
                    value={editedQuestion[key] as string}
                    onChange={(e) => updateField(key, e.target.value)}
                    className='flex-1 px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm'
                  />
                </div>
              );
            })}
          </div>
          <div className='text-xs text-gray-500 mt-2'>
            Select the radio button for the correct answer
          </div>
        </div>

        {/* Explanation */}
        <div className='mb-5'>
          <label className='block text-[13px] font-semibold mb-1.5'>
            Explanation
          </label>
          <textarea
            value={editedQuestion.explanation || ""}
            onChange={(e) => updateField("explanation", e.target.value)}
            className='w-full px-3 py-3 border border-gray-200 rounded-lg text-sm resize-y min-h-[80px]'
          />
        </div>

        {/* Metadata Grid */}
        <div className='grid grid-cols-2 gap-4 mb-5'>
          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Book Title
            </label>
            <input
              value={editedQuestion.book_title}
              onChange={(e) => updateField("book_title", e.target.value)}
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm'
            />
          </div>

          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Edition
            </label>
            <input
              value={editedQuestion.edition || ""}
              onChange={(e) => updateField("edition", e.target.value)}
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm'
            />
          </div>

          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Chapter
            </label>
            <input
              value={editedQuestion.chapter}
              onChange={(e) => updateField("chapter", e.target.value)}
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm'
            />
          </div>

          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Topic
            </label>
            <input
              value={editedQuestion.topic || ""}
              onChange={(e) => updateField("topic", e.target.value)}
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm'
            />
          </div>

          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Page Start
            </label>
            <input
              type='number'
              value={editedQuestion.page_start || ""}
              onChange={(e) =>
                updateField("page_start", parseInt(e.target.value) || null)
              }
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm'
            />
          </div>

          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Page End
            </label>
            <input
              type='number'
              value={editedQuestion.page_end || ""}
              onChange={(e) =>
                updateField("page_end", parseInt(e.target.value) || null)
              }
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm'
            />
          </div>
        </div>

        {/* Settings */}
        <div className='grid grid-cols-3 gap-4 mb-6'>
          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Difficulty
            </label>
            <select
              value={editedQuestion.difficulty}
              onChange={(e) =>
                updateField(
                  "difficulty",
                  e.target.value as "easy" | "medium" | "hard",
                )
              }
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white'
            >
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
            </select>
          </div>

          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Study Eligible
            </label>
            <select
              value={editedQuestion.study_eligible ? "true" : "false"}
              onChange={(e) =>
                updateField("study_eligible", e.target.value === "true")
              }
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white'
            >
              <option value='true'>Yes</option>
              <option value='false'>No</option>
            </select>
          </div>

          <div>
            <label className='block text-[13px] font-semibold mb-1.5'>
              Exam Eligible
            </label>
            <select
              value={editedQuestion.exam_eligible ? "true" : "false"}
              onChange={(e) =>
                updateField("exam_eligible", e.target.value === "true")
              }
              className='w-full px-2.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white'
            >
              <option value='true'>Yes</option>
              <option value='false'>No</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onClose}
            disabled={saving}
            className='px-5 py-2.5 bg-transparent border border-gray-200 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedQuestion)}
            disabled={saving}
            className='px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700'
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminQuestionsPage() {
  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [answerDist, setAnswerDist] = useState<AnswerDistribution>({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    total: 0,
  });
  const [filters, setFilters] = useState<FilterState>({
    bookTitle: "",
    chapter: "",
    difficulty: "",
    studyEligible: "",
    examEligible: "",
    searchText: "",
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [bookTitles, setBookTitles] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const { data: booksData } = await supabase
        .from("questions")
        .select("book_title")
        .eq("is_active", true);

      const uniqueBooks = [
        ...new Set(booksData?.map((q) => q.book_title) || []),
      ];
      setBookTitles(uniqueBooks.sort());

      const { data: chaptersData } = await supabase
        .from("questions")
        .select("chapter")
        .eq("is_active", true);

      const uniqueChapters = [
        ...new Set(chaptersData?.map((q) => q.chapter) || []),
      ];
      setChapters(
        uniqueChapters.sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        }),
      );
    };
    loadFilterOptions();
  }, []);

  // Build query with filters
  const buildQuery = useCallback(
    (baseQuery: any) => {
      let query = baseQuery;
      if (filters.bookTitle) query = query.eq("book_title", filters.bookTitle);
      if (filters.chapter) query = query.eq("chapter", filters.chapter);
      if (filters.difficulty)
        query = query.eq("difficulty", filters.difficulty);
      if (filters.studyEligible)
        query = query.eq("study_eligible", filters.studyEligible === "true");
      if (filters.examEligible)
        query = query.eq("exam_eligible", filters.examEligible === "true");
      if (filters.searchText)
        query = query.ilike("question_text", `%${filters.searchText}%`);
      return query;
    },
    [filters],
  );

  // Load answer distribution
  const loadAnswerDistribution = useCallback(async () => {
    try {
      const query = buildQuery(
        supabase
          .from("questions")
          .select("correct_answer")
          .eq("is_active", true),
      );
      const { data } = await query;

      if (data) {
        const dist = { A: 0, B: 0, C: 0, D: 0, total: data.length };
        data.forEach((q: Question) => {
          if (q.correct_answer in dist) {
            dist[q.correct_answer as "A" | "B" | "C" | "D"]++;
          }
        });
        setAnswerDist(dist);
      }
    } catch (error) {
      console.error("Error loading answer distribution:", error);
    }
  }, [buildQuery]);

  // Load questions with pagination
  const loadQuestions = useCallback(async () => {
    setLoading(true);

    try {
      const query = buildQuery(
        supabase
          .from("questions")
          .select("*", { count: "exact" })
          .eq("is_active", true),
      );

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query
        .range(from, to)
        .order("id", { ascending: true });

      if (error) throw error;

      setQuestions(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, buildQuery]);

  // Reload when page or filters change
  useEffect(() => {
    loadQuestions();
    loadAnswerDistribution();
  }, [loadQuestions, loadAnswerDistribution]);

  // Handlers
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      bookTitle: "",
      chapter: "",
      difficulty: "",
      studyEligible: "",
      examEligible: "",
      searchText: "",
    });
    setCurrentPage(1);
  };

  const handleSaveEdit = async (editedQuestion: Question) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("questions")
        .update({
          question_text: editedQuestion.question_text,
          answer_a: editedQuestion.answer_a,
          answer_b: editedQuestion.answer_b,
          answer_c: editedQuestion.answer_c,
          answer_d: editedQuestion.answer_d,
          correct_answer: editedQuestion.correct_answer,
          explanation: editedQuestion.explanation,
          difficulty: editedQuestion.difficulty,
          study_eligible: editedQuestion.study_eligible,
          exam_eligible: editedQuestion.exam_eligible,
          book_title: editedQuestion.book_title,
          edition: editedQuestion.edition,
          chapter: editedQuestion.chapter,
          topic: editedQuestion.topic,
          page_start: editedQuestion.page_start,
          page_end: editedQuestion.page_end,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editedQuestion.id);

      if (error) throw error;

      setEditingQuestion(null);
      loadQuestions();
      loadAnswerDistribution();
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const { error } = await supabase
        .from("questions")
        .update({ is_active: false })
        .eq("id", questionId);

      if (error) throw error;

      loadQuestions();
      loadAnswerDistribution();
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question");
    }
  };

  const toggleEligibility = async (
    questionId: string,
    field: "study_eligible" | "exam_eligible",
    currentValue: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("questions")
        .update({ [field]: !currentValue })
        .eq("id", questionId);

      if (error) throw error;
      loadQuestions();
      if (field === "exam_eligible") loadAnswerDistribution();
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      alert("Failed to update question");
    }
  };

  const hasFilters = Object.values(filters).some((v) => v !== "");
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className='p-9 max-w-[1400px]'>
      {/* Header */}
      <div className='mb-7'>
        <div className='text-[26px] font-bold mb-1'>Questions</div>
        <div className='text-[13.5px] text-gray-500'>
          {totalCount.toLocaleString()} of {totalCount.toLocaleString()} active
          questions
          {hasFilters && " (filtered)"}
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        bookTitles={bookTitles}
        chapters={chapters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        hasFilters={hasFilters}
      />

      {/* Answer Distribution */}
      <AnswerDistributionChart distribution={answerDist} />

      {/* Loading State */}
      {loading && (
        <div className='text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl'>
          <div className='text-3xl mb-3'>⏳</div>
          <div>Loading questions...</div>
        </div>
      )}

      {/* Questions Table */}
      {!loading && questions.length > 0 && (
        <>
          <div className='bg-white border border-gray-200 rounded-xl overflow-hidden mb-5'>
            <table className='w-full'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                    #
                  </th>
                  <th className='px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                    Question
                  </th>
                  <th className='px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                    Book / Chapter
                  </th>
                  <th className='px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                    Difficulty
                  </th>
                  <th className='px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                    Study
                  </th>
                  <th className='px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                    Exam
                  </th>
                  <th className='px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className='border-b border-gray-200'>
                    <td className='px-4 py-3.5 text-[13px] text-gray-500'>
                      {q.id}
                    </td>
                    <td className='px-4 py-3.5 text-[13px] max-w-[400px]'>
                      {q.question_text.substring(0, 100)}
                      {q.question_text.length > 100 && "..."}
                    </td>
                    <td className='px-4 py-3.5 text-xs'>
                      <div className='font-semibold mb-0.5'>{q.book_title}</div>
                      <div className='text-gray-500'>Ch. {q.chapter}</div>
                    </td>
                    <td className='px-4 py-3.5 text-center'>
                      <DifficultyBadge difficulty={q.difficulty} />
                    </td>
                    <td className='px-4 py-3.5 text-center'>
                      <button
                        onClick={() =>
                          toggleEligibility(
                            q.id,
                            "study_eligible",
                            q.study_eligible,
                          )
                        }
                        className={`px-2.5 py-1 text-[11px] font-bold ${q.study_eligible ? "text-green-700" : "text-gray-400"}`}
                        title={`Click to ${q.study_eligible ? "disable" : "enable"} for study mode`}
                      >
                        {q.study_eligible ? "Yes" : "No"}
                      </button>
                    </td>
                    <td className='px-4 py-3.5 text-center'>
                      <button
                        onClick={() =>
                          toggleEligibility(
                            q.id,
                            "exam_eligible",
                            q.exam_eligible,
                          )
                        }
                        className={`px-2.5 py-1 text-[11px] font-bold ${q.exam_eligible ? "text-green-700" : "text-gray-400"}`}
                        title={`Click to ${q.exam_eligible ? "disable" : "enable"} for exam mode`}
                      >
                        {q.exam_eligible ? "Yes" : "No"}
                      </button>
                    </td>
                    <td className='px-4 py-3.5'>
                      <div className='flex gap-2 justify-center'>
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className='px-2.5 py-1.5 bg-transparent border border-gray-200 rounded-md text-lg leading-none hover:bg-gray-50'
                          title='Edit question'
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className='px-2.5 py-1.5 bg-transparent border border-gray-200 rounded-md text-lg leading-none text-red-600 hover:bg-red-50'
                          title='Delete question'
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className='bg-white border border-gray-200 rounded-xl p-16 text-center'>
          <div className='text-5xl mb-3'>📋</div>
          <div className='text-base font-semibold mb-1.5'>
            No questions found
          </div>
          <div className='text-[13px] text-gray-500'>
            {hasFilters
              ? "Try adjusting your filters"
              : "Start by importing questions from CSV"}
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className='mt-4 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700'
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingQuestion && (
        <EditModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveEdit}
          saving={saving}
        />
      )}
    </div>
  );
}
