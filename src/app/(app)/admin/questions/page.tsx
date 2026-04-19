"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Edit, Trash2, Plus } from "lucide-react";

type Question = {
  id: string;
  book_title: string;
  chapter: string;
  question_text: string;
  difficulty: string;
  study_oligible: boolean;
  exam_eligible: boolean;
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [studyFilter, setStudyFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");

  // Available options
  const [books, setBooks] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    questions,
    searchText,
    selectedBook,
    selectedChapter,
    selectedDifficulty,
    studyFilter,
    examFilter,
  ]);

  useEffect(() => {
    // Update chapters when book changes
    if (selectedBook) {
      const bookChapters = questions
        .filter((q) => q.book_title === selectedBook)
        .map((q) => q.chapter)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          return numA - numB;
        });
      setChapters(bookChapters);
      setSelectedChapter("");
    } else {
      setChapters([]);
      setSelectedChapter("");
    }
  }, [selectedBook, questions]);

  async function loadQuestions() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("is_active", true)
        .order("id", { ascending: false })
        .limit(5000);

      if (error) throw error;

      setQuestions(data || []);

      // Extract unique books
      const uniqueBooks = [
        ...new Set(data?.map((q) => q.book_title) || []),
      ].sort();
      setBooks(uniqueBooks);
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...questions];

    // Text search
    if (searchText) {
      filtered = filtered.filter((q) =>
        q.question_text.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Book filter
    if (selectedBook) {
      filtered = filtered.filter((q) => q.book_title === selectedBook);
    }

    // Chapter filter
    if (selectedChapter) {
      filtered = filtered.filter((q) => q.chapter === selectedChapter);
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }

    // Study eligible filter
    if (studyFilter === "yes") {
      filtered = filtered.filter((q) => q.study_oligible === true);
    } else if (studyFilter === "no") {
      filtered = filtered.filter((q) => q.study_oligible === false);
    }

    // Exam eligible filter
    if (examFilter === "yes") {
      filtered = filtered.filter((q) => q.exam_eligible === true);
    } else if (examFilter === "no") {
      filtered = filtered.filter((q) => q.exam_eligible === false);
    }

    setFilteredQuestions(filtered);
  }

  function clearFilters() {
    setSearchText("");
    setSelectedBook("");
    setSelectedChapter("");
    setSelectedDifficulty("");
    setStudyFilter("");
    setExamFilter("");
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("questions")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      loadQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question");
    }
  }

  const activeFiltersCount = [
    searchText,
    selectedBook,
    selectedChapter,
    selectedDifficulty,
    studyFilter,
    examFilter,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className='p-8'>
        <div className='text-center'>Loading questions...</div>
      </div>
    );
  }

  return (
    <div className='p-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-[#1B2A4A]'>Questions</h1>
          <p className='text-sm text-gray-500 mt-1'>
            {filteredQuestions.length} of {questions.length} active questions
            {activeFiltersCount > 0 &&
              ` (${activeFiltersCount} filters active)`}
          </p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => (window.location.href = "/admin/questions/new")}
            className='flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white rounded-lg hover:bg-[#B71C1C] transition-colors'
          >
            <Plus className='w-4 h-4' />
            Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-xl border border-gray-200 p-6 mb-6'>
        {/* Search Bar */}
        <div className='mb-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Search question text...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent'
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
          {/* Book Filter */}
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent'
          >
            <option value=''>All Books</option>
            {books.map((book) => (
              <option key={book} value={book}>
                {book.length > 30 ? book.substring(0, 30) + "..." : book}
              </option>
            ))}
          </select>

          {/* Chapter Filter */}
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            disabled={!selectedBook}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
          >
            <option value=''>All Chapters</option>
            {chapters.map((chapter) => (
              <option key={chapter} value={chapter}>
                Chapter {chapter}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent'
          >
            <option value=''>All Difficulties</option>
            <option value='easy'>Easy</option>
            <option value='medium'>Medium</option>
            <option value='hard'>Hard</option>
          </select>

          {/* Study Eligible Filter */}
          <select
            value={studyFilter}
            onChange={(e) => setStudyFilter(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent'
          >
            <option value=''>Study: All</option>
            <option value='yes'>Study: Yes</option>
            <option value='no'>Study: No</option>
          </select>

          {/* Exam Eligible Filter */}
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent'
          >
            <option value=''>Exam: All</option>
            <option value='yes'>Exam: Yes</option>
            <option value='no'>Exam: No</option>
          </select>
        </div>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <div className='mt-4 flex justify-end'>
            <button
              onClick={clearFilters}
              className='text-sm text-gray-600 hover:text-gray-900 underline'
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Questions Table */}
      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='bg-gray-50 border-b border-gray-200'>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Question
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Book / Chapter
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Difficulty
                </th>
                <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Study
                </th>
                <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Exam
                </th>
                <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-12 text-center text-gray-500'
                  >
                    No questions found matching your filters
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => (
                  <tr key={question.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 text-sm text-gray-900 max-w-md'>
                      {question.question_text.substring(0, 100)}
                      {question.question_text.length > 100 && "..."}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      <div className='font-medium text-gray-900'>
                        {question.book_title.substring(0, 30)}
                        {question.book_title.length > 30 && "..."}
                      </div>
                      <div className='text-gray-500'>
                        Ch. {question.chapter}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={
                          question.difficulty === "easy"
                            ? "inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800"
                            : question.difficulty === "medium"
                              ? "inline-block px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800"
                              : "inline-block px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800"
                        }
                      >
                        {question.difficulty}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-center'>
                      <span
                        className={
                          question.study_oligible
                            ? "inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800"
                            : "inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600"
                        }
                      >
                        {question.study_oligible ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-center'>
                      <span
                        className={
                          question.exam_eligible
                            ? "inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
                            : "inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600"
                        }
                      >
                        {question.exam_eligible ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-center gap-2'>
                        <button
                          onClick={() =>
                            (window.location.href = `/admin/questions/${question.id}/edit`)
                          }
                          className='p-1.5 text-blue-600 hover:bg-blue-50 rounded'
                          title='Edit'
                        >
                          <Edit className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className='p-1.5 text-red-600 hover:bg-red-50 rounded'
                          title='Delete'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
