"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserStatsCache } from "@/types";

type StudentWithStats = Profile & { user_stats_cache: UserStatsCache | null };

export default function StudentsTable({
  students,
}: {
  students: StudentWithStats[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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

  return (
    <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
      <table className='w-full text-sm'>
        <thead className='bg-gray-50 border-b border-gray-200'>
          <tr className='text-left text-xs text-gray-500 uppercase tracking-wide'>
            <th className='px-4 py-3'>Name</th>
            <th className='px-4 py-3'>Department</th>
            <th className='px-4 py-3'>Exam</th>
            <th className='px-4 py-3'>Sessions</th>
            <th className='px-4 py-3'>Avg Score</th>
            <th className='px-4 py-3'>Best Score</th>
            <th className='px-4 py-3'>Last Active</th>
            <th className='px-4 py-3'>Actions</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-100'>
          {students.length === 0 && (
            <tr>
              <td colSpan={8} className='px-4 py-8 text-center text-gray-400'>
                No students registered yet
              </td>
            </tr>
          )}
          {students.map((s) => {
            const stats = s.user_stats_cache;
            const isConfirming = confirmId === s.id;
            const isDeleting = deletingId === s.id;

            return (
              <tr key={s.id} className='hover:bg-gray-50'>
                <td className='px-4 py-3'>
                  <div className='font-medium text-gray-800'>
                    {s.full_name || "—"}
                  </div>
                  <div className='text-xs text-gray-400'>{s.email}</div>
                </td>
                <td className='px-4 py-3 text-gray-600'>
                  {s.department || "—"}
                </td>
                <td className='px-4 py-3'>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      s.exam_type === "captain"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {s.exam_type === "captain" ? "Captain" : "Lt."}
                  </span>
                </td>
                <td className='px-4 py-3 text-gray-600'>
                  {stats?.total_sessions ?? 0}
                </td>
                <td className='px-4 py-3'>
                  {stats?.avg_score_percent ? (
                    <span
                      className={`font-semibold ${stats.avg_score_percent >= 70 ? "text-green-600" : "text-red-600"}`}
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
                      className={`font-semibold ${stats.best_score_percent >= 70 ? "text-green-600" : "text-amber-600"}`}
                    >
                      {stats.best_score_percent}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className='px-4 py-3 text-gray-500 text-xs'>
                  {stats?.last_session_at
                    ? new Date(stats.last_session_at).toLocaleDateString()
                    : "Never"}
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
                        className='text-xs font-semibold text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200'
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      className='text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 transition-colors'
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
