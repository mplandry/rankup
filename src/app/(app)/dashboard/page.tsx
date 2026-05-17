"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import ReferralCard from "@/components/ReferralCard";
import TrialExpirationPrompt from "@/components/TrialExpirationPrompt";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", session.user.id);

      const totalSessions = data?.length || 0;
      const totalQuestions =
        data?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0;
      const avgScore = data?.length
        ? Math.round(
            data.reduce((sum, s) => sum + (s.score || 0), 0) / data.length,
          )
        : 0;

      setStats({ totalSessions, totalQuestions, avgScore });
    };
    init();
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Firefighter";
  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <TrialExpirationPrompt />
      <div className='p-9 max-w-[1400px]'>
        <div className='mb-7 flex items-start justify-between'>
          <div>
            <div className='text-[26px] font-bold mb-1'>
              Welcome back, {userName}
            </div>
            <div className='text-[13.5px] text-gray-500'>
              Ready to continue your training?
            </div>
          </div>
          <SubscriptionBadge />
        </div>

        <div className='grid grid-cols-3 gap-5 mb-7'>
          <div className='bg-white border border-gray-200 rounded-xl p-7'>
            <div className='text-[13px] font-bold text-gray-500 uppercase mb-1.5'>
              Study Sessions
            </div>
            <div className='text-[32px] font-bold text-gray-900'>
              {stats?.totalSessions || 0}
            </div>
          </div>

          <div className='bg-white border border-gray-200 rounded-xl p-7'>
            <div className='text-[13px] font-bold text-gray-500 uppercase mb-1.5'>
              Questions Answered
            </div>
            <div className='text-[32px] font-bold text-gray-900'>
              {stats?.totalQuestions || 0}
            </div>
          </div>

          <div className='bg-white border border-gray-200 rounded-xl p-7'>
            <div className='text-[13px] font-bold text-gray-500 uppercase mb-1.5'>
              Average Score
            </div>
            <div className='text-[32px] font-bold text-gray-900'>
              {stats?.avgScore || 0}%
            </div>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-5 mb-7'>
          <div
            onClick={() => router.push("/study")}
            className='bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-9 cursor-pointer hover:shadow-lg transition-shadow'
          >
            <div className='text-5xl mb-4'>📖</div>
            <div className='text-[22px] font-bold mb-2'>Study Mode</div>
            <div className='text-blue-100 text-sm'>
              Practice with instant feedback and explanations
            </div>
          </div>

          <div
            onClick={() => router.push("/exam")}
            className='bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-9 cursor-pointer hover:shadow-lg transition-shadow'
          >
            <div className='text-5xl mb-4'>🎯</div>
            <div className='text-[22px] font-bold mb-2'>Exam Mode</div>
            <div className='text-red-100 text-sm'>
              Timed 90-question exams with results at the end
            </div>
          </div>
        </div>

        <ReferralCard />
      </div>
    </>
  );
}
