"use client";

import { useHistoryStore } from "@/store/useHistoryStore";
import { formatTime } from "@/lib/utils";
import { Clock, Flame, Target, TrendingUp, LogOut } from "lucide-react";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const entries = useHistoryStore((s) => s.entries);
  const router = useRouter();

  const stats = useMemo(() => {
    const totalFocus = entries.reduce((sum, e) => sum + e.session.focusSeconds, 0);
    const completed = entries.filter((e) => e.status !== "abandoned").length;
    const totalPlanned = entries.reduce((sum, e) => sum + e.session.plannedSeconds, 0);
    const avgRate = totalPlanned > 0 ? Math.round((totalFocus / totalPlanned) * 100) : 0;

    // 연속 일수 계산
    const dates = [...new Set(entries.map((e) => e.sessionDate))].sort((a, b) => b.localeCompare(a));
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = today;
    for (const date of dates) {
      if (date === checkDate) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else if (date < checkDate) {
        break;
      }
    }

    return { totalFocus, completed, totalSessions: entries.length, avgRate, streak };
  }, [entries]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="flex-1 w-full flex flex-col items-center px-4 pt-8 pb-28">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">내 정보</h1>
          <p className="text-sm text-slate-400 mt-0.5">집중 통계 요약</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-500/10 border border-blue-500/15 rounded-2xl p-4">
            <Clock className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-blue-400">{formatTime(stats.totalFocus)}</p>
            <p className="text-xs text-slate-400 mt-1">총 집중 시간</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-2xl p-4">
            <Target className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
            <p className="text-xs text-slate-400 mt-1">완료한 세션</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/15 rounded-2xl p-4">
            <TrendingUp className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-amber-400">{stats.avgRate}%</p>
            <p className="text-xs text-slate-400 mt-1">평균 달성률</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/15 rounded-2xl p-4">
            <Flame className="w-5 h-5 text-orange-400 mb-2" />
            <p className="text-2xl font-bold text-orange-400">{stats.streak}일</p>
            <p className="text-xs text-slate-400 mt-1">연속 기록</p>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </main>
  );
}
