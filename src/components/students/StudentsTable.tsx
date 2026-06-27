"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";
type StudentWithStats = Profile & { user_stats_cache: any | null };

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function timeAgo(date: string | null): string {
  if (!date) return "Never";

  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function exportToCSV(students: StudentWithStats[]) {
  const headers = [
    "Name",
    "Email",
    "Department",
    "Exam Type",
    "Total Sessions",
    "Avg Score %",
    "Best Score %",
    "Plan",
    "Payment Status",
    "Last Active",
    "Created Date",
  ];

  const rows = students.map((s) => [
    s.full_name || "",
    s.email,
    s.department || "",
    s.exam_type || "",
    s.user_stats_cache?.total_sessions || 0,
    s.user_stats_cache?.avg_score_percent || 0,
    s.user_stats_cache?.best_score_percent || 0,
    s.subscription_plan || "Free",
    s.subscription_status || "—",
    s.last_sign_in_at
      ? new Date(s.last_sign_in_at).toLocaleDateString()
      : "Never",
    new Date(s.created_at).toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell,
        )
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// DETAILED STUDENT MODAL
// ============================================================================

function StudentDetailModal({
  student,
  onClose,
}: {
  student: StudentWithStats;
  onClose: () => void;
}) {
  const stats = student.user_stats_cache;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-[#111827] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center'>
          <div>
            <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
              {student.full_name || "Student Details"}
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400'>{student.email}</p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 text-2xl leading-none'
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Basic Info */}
          <div>
            <h3 className='text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3'>
              Basic Information
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>Department</div>
                <div className='font-semibold'>{student.department || "—"}</div>
              </div>
              <div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>Exam Type</div>
                <div className='font-semibold'>
                  {student.exam_type === "captain" ? "Captain" : "Lieutenant"}
                </div>
              </div>
              <div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>Last Active</div>
                <div className='font-semibold'>
                  {timeAgo(student.last_sign_in_at || null)}
                </div>
              </div>
              <div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>Member Since</div>
                <div className='font-semibold'>
                  {new Date(student.created_at).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>Plan</div>
                <div className='font-semibold'>
                  {student.subscription_plan ? (
                    <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 whitespace-nowrap'>
                      {student.subscription_plan === 'monthly' ? 'Monthly' :
                       student.subscription_plan === 'exam_prep' ? 'Exam Prep' :
                       student.subscription_plan === 'department' ? 'Department Rate' :
                       student.subscription_plan}
                    </span>
                  ) : (
                    <span className='text-xs text-gray-400 dark:text-gray-500'>Free</span>
                  )}
                </div>
              </div>
              <div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>Payment Status</div>
                <div className='font-semibold'>
                  {student.subscription_status ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      student.subscription_status === 'paid' || student.subscription_status === 'succeeded'
                        ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' :
                      student.subscription_status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                    }`}>
                      {student.subscription_status}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div>
            <h3 className='text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3'>
              Performance
            </h3>
            <div className='grid grid-cols-3 gap-4'>
              <div className='bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4'>
                <div className='text-xs text-blue-600 dark:text-blue-400 font-semibold'>
                  Total Sessions
                </div>
                <div className='text-2xl font-bold text-blue-900 dark:text-blue-300'>
                  {stats?.total_sessions || 0}
                </div>
              </div>
              <div className='bg-green-50 dark:bg-green-950/30 rounded-lg p-4'>
                <div className='text-xs text-green-600 dark:text-green-400 font-semibold'>
                  Avg Score
                </div>
                <div className='text-2xl font-bold text-green-900 dark:text-green-300'>
                  {stats?.avg_score_percent || 0}%
                </div>
              </div>
              <div className='bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4'>
                <div className='text-xs text-purple-600 dark:text-purple-400 font-semibold'>
                  Best Score
                </div>
                <div className='text-2xl font-bold text-purple-900 dark:text-purple-300'>
                  {stats?.best_score_percent || 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Questions Stats */}
          {stats && (
            <div>
              <h3 className='text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3'>
                Question History
              </h3>
              <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>Total Questions</span>
                  <span className='font-semibold'>{stats.total_questions}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>Correct Answers</span>
                  <span className='font-semibold text-green-600 dark:text-green-400'>
                    {stats.total_correct}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>
                    Incorrect Answers
                  </span>
                  <span className='font-semibold text-red-600 dark:text-red-400'>
                    {stats.total_questions - stats.total_correct}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>Last Session</span>
                  <span className='font-semibold'>
                    {stats.last_session_at
                      ? new Date(stats.last_session_at).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4 border-t'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EDIT STUDENT MODAL
// ============================================================================

function EditStudentModal({
  student,
  onClose,
  onSave,
}: {
  student: StudentWithStats;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Profile>) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(student.full_name || "");
  const [department, setDepartment] = useState(student.department || "");
  const [examType, setExamType] = useState(student.exam_type || "lieutenant");
  const [subscriptionStatus, setSubscriptionStatus] = useState(student.subscription_status || "trial");
  const [subscriptionPlan, setSubscriptionPlan] = useState(student.subscription_plan || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(student.id, {
        full_name: fullName,
        department: department,
        exam_type: examType,
        subscription_status: subscriptionStatus,
        subscription_plan: subscriptionPlan || null,
      } as any);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-[#111827] rounded-xl max-w-md w-full'>
        <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100'>Edit Student</h2>
          <p className='text-sm text-gray-500 dark:text-gray-400'>{student.email}</p>
        </div>

        <div className='p-6 space-y-4'>
          <div>
            <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1'>
              Full Name
            </label>
            <input
              type='text'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100'
            />
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1'>
              Department
            </label>
            <input
              type='text'
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100'
              placeholder='e.g., Boston Fire Department'
            />
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1'>
              Exam Type
            </label>
            <select
              value={examType}
              className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100'
              onChange={(e) =>
                setExamType(e.target.value as "lieutenant" | "captain")
              }
            >
              <option value='lieutenant'>Lieutenant</option>
              <option value='captain'>Captain</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1'>
              Subscription Status
            </label>
            <select
              value={subscriptionStatus}
              className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100'
              onChange={(e) => setSubscriptionStatus(e.target.value)}
            >
              <option value='trial'>Trial</option>
              <option value='active'>Active</option>
              <option value='free'>Free</option>
              <option value='expired'>Expired</option>
              <option value='cancelled'>Cancelled</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1'>
              Plan
            </label>
            <select
              value={subscriptionPlan}
              className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100'
              onChange={(e) => setSubscriptionPlan(e.target.value)}
            >
              <option value=''>None (Free)</option>
              <option value='exam_prep'>Exam Prep</option>
              <option value='monthly'>Monthly</option>
              <option value='department'>Department Rate</option>
            </select>
          </div>
        </div>

        <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50'
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

export default function StudentsTable({
  students,
}: {
  students: StudentWithStats[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(),
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailStudent, setDetailStudent] = useState<StudentWithStats | null>(
    null,
  );
  const [editStudent, setEditStudent] = useState<StudentWithStats | null>(null);
  const [emailingInactive, setEmailingInactive] = useState(false);

  // Filtered students
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q),
      );
    }

    // Exam type filter
    if (examFilter !== "all") {
      filtered = filtered.filter((s) => s.exam_type === examFilter);
    }

    // Activity filter
    if (activityFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((s) => {
        if (!s.last_sign_in_at) return activityFilter === "inactive";
        const lastActive = new Date(s.last_sign_in_at);
        const daysSince = Math.floor(
          (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (activityFilter === "active7") return daysSince <= 7;
        if (activityFilter === "active30") return daysSince <= 30;
        if (activityFilter === "inactive") return daysSince > 30;
        return true;
      });
    }

    // Performance filter
    if (performanceFilter !== "all") {
      filtered = filtered.filter((s) => {
        const avg = s.user_stats_cache?.avg_score_percent || 0;
        if (performanceFilter === "passing") return avg >= 70;
        if (performanceFilter === "failing") return avg < 70 && avg > 0;
        if (performanceFilter === "nosessions")
          return !s.user_stats_cache?.total_sessions;
        return true;
      });
    }

    return filtered;
  }, [students, searchQuery, examFilter, activityFilter, performanceFilter]);

  // Handlers
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setConfirmId(null);
      router.refresh();
    } catch (err) {
      alert("Failed to delete student. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedStudents.size} selected students?`)) return;

    try {
      await Promise.all(
        Array.from(selectedStudents).map((id) =>
          fetch(`/api/students/${id}`, { method: "DELETE" }),
        ),
      );
      setSelectedStudents(new Set());
      router.refresh();
    } catch (err) {
      alert("Failed to delete some students.");
    }
  }

  async function handleEditSave(id: string, updates: Partial<Profile>) {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      router.refresh();
    } catch (err) {
      alert("Failed to update student.");
      throw err;
    }
  }

  async function handleEmailInactive() {
    setEmailingInactive(true);
    try {
      const res = await fetch("/api/students/email-inactive", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send emails");
      alert(`Sent ${data.count || 0} emails to inactive students.`);
    } catch (err) {
      alert("Failed to send emails.");
    } finally {
      setEmailingInactive(false);
    }
  }

  function toggleStudent(id: string) {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedStudents(newSet);
  }

  function toggleAll() {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  }

  return (
    <>
      {/* Search & Filters */}
      <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3'>
          <input
            type='text'
            placeholder='Search by name, email, or department...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='lg:col-span-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm'
          />

          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className='px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm'
          >
            <option value='all'>All Exams</option>
            <option value='lieutenant'>Lieutenant</option>
            <option value='captain'>Captain</option>
          </select>

          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className='px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm'
          >
            <option value='all'>All Activity</option>
            <option value='active7'>Active (7 days)</option>
            <option value='active30'>Active (30 days)</option>
            <option value='inactive'>Inactive (30+ days)</option>
          </select>

          <select
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value)}
            className='px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm'
          >
            <option value='all'>All Performance</option>
            <option value='passing'>Passing (≥70%)</option>
            <option value='failing'>Failing (&lt;70%)</option>
            <option value='nosessions'>No Sessions</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 flex-wrap'>
          <button
            onClick={() => exportToCSV(filteredStudents)}
            className='px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700'
          >
            📥 Export CSV ({filteredStudents.length})
          </button>

          <button
            onClick={handleEmailInactive}
            disabled={emailingInactive}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50'
          >
            {emailingInactive ? "Sending..." : "📧 Email Inactive"}
          </button>

          {selectedStudents.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className='px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700'
            >
              🗑️ Delete Selected ({selectedStudents.size})
            </button>
          )}

          {(searchQuery ||
            examFilter !== "all" ||
            activityFilter !== "all" ||
            performanceFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setExamFilter("all");
                setActivityFilter("all");
                setPerformanceFilter("all");
              }}
              className='px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700'
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden'>
        <table className='w-full text-sm'>
          <thead className='bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700'>
            <tr className='text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
              <th className='px-4 py-3'>
                <input
                  type='checkbox'
                  checked={
                    selectedStudents.size === filteredStudents.length &&
                    filteredStudents.length > 0
                  }
                  onChange={toggleAll}
                  className='rounded border-gray-300 dark:border-gray-600'
                />
              </th>
              <th className='px-4 py-3'>Name</th>
              <th className='px-4 py-3'>Department</th>
              <th className='px-4 py-3'>Exam</th>
              <th className='px-4 py-3'>Sessions</th>
              <th className='px-4 py-3'>Avg Score</th>
              <th className='px-4 py-3'>Best Score</th>
              <th className='px-4 py-3'>Plan</th>
              <th className='px-4 py-3'>Payment</th>
              <th className='px-4 py-3'>Last Active</th>
              <th className='px-4 py-3'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100 dark:divide-gray-800'>
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={11} className='px-4 py-8 text-center text-gray-400 dark:text-gray-500'>
                  {students.length === 0
                    ? "No students registered yet"
                    : "No students match your filters"}
                </td>
              </tr>
            )}
            {filteredStudents.map((s) => {
              const stats = s.user_stats_cache;
              const isConfirming = confirmId === s.id;
              const isDeleting = deletingId === s.id;
              const isSelected = selectedStudents.has(s.id);

              return (
                <tr key={s.id} className='hover:bg-gray-50 dark:hover:bg-gray-900'>
                  <td className='px-4 py-3'>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => toggleStudent(s.id)}
                      className='rounded border-gray-300 dark:border-gray-600'
                    />
                  </td>
                  <td className='px-4 py-3'>
                    <button
                      onClick={() => setDetailStudent(s)}
                      className='text-left hover:text-blue-600 dark:hover:text-blue-400'
                    >
                      <div className='font-medium text-gray-800 dark:text-gray-200 hover:underline'>
                        {s.full_name || "—"}
                      </div>
                      <div className='text-xs text-gray-400 dark:text-gray-500'>{s.email}</div>
                    </button>
                  </td>
                  <td className='px-4 py-3 text-gray-600 dark:text-gray-400'>
                    {s.department || "—"}
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        s.exam_type === "captain"
                          ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                          : "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400"
                      }`}
                    >
                      {s.exam_type === "captain" ? "Captain" : "Lt."}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-gray-600 dark:text-gray-400'>
                    {stats?.total_sessions ?? 0}
                  </td>
                  <td className='px-4 py-3'>
                    {stats?.avg_score_percent ? (
                      <span
                        className={`font-semibold ${stats.avg_score_percent >= 70 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {stats.avg_score_percent}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    {stats?.best_score_percent ? (
                      <span
                        className={`font-semibold ${stats.best_score_percent >= 70 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                      >
                        {stats.best_score_percent}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    {s.subscription_plan ? (
                      <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 whitespace-nowrap'>
                        {s.subscription_plan === 'monthly' ? 'Monthly' :
                         s.subscription_plan === 'exam_prep' ? 'Exam Prep' :
                         s.subscription_plan === 'department' ? 'Dept Rate' :
                         s.subscription_plan}
                      </span>
                    ) : (
                      <span className='text-xs text-gray-400 dark:text-gray-500'>Free</span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    {s.subscription_status ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        s.subscription_status === 'paid' || s.subscription_status === 'succeeded'
                          ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' :
                        s.subscription_status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                      }`}>
                        {s.subscription_status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className='px-4 py-3 text-gray-500 dark:text-gray-400 text-xs'>
                    {timeAgo(s.last_sign_in_at || null)}
                  </td>
                  <td className='px-4 py-3'>
                    {isConfirming ? (
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={isDeleting}
                          className='text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg disabled:opacity-60'
                        >
                          {isDeleting ? "Deleting..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className='text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700'
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className='flex gap-2'>
                        <button
                          onClick={() => setEditStudent(s)}
                          className='text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmId(s.id)}
                          className='text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 transition-colors'
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          onClose={() => setDetailStudent(null)}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}
