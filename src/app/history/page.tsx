"use client";

import { useHistoryStore, type HistoryEntry } from "@/store/useHistoryStore";
import { formatTime } from "@/lib/utils";
import { Clock, Flame, Trash2, Calendar, TrendingUp, Zap } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: HistoryEntry["status"] }) {
  const config = {
    completed: { label: "완료", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    completed_overtime: { label: "연장 완료", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    abandoned: { label: "포기", className: "bg-red-500/15 text-red-400 border-red-500/20" },
  };
  const c = config[status];
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-md border", c.className)}>
      {c.label}
    </span>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const { session } = entry;
  const focusRate = session.plannedSeconds > 0
    ? Math.round((session.focusSeconds / session.plannedSeconds) * 100)
    : 0;

  const startTime = session.startedAt
    ? new Date(session.startedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const endTime = session.endedAt
    ? new Date(session.endedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="group bg-slate-900/40 hover:bg-slate-800/50 border border-slate-800/50 hover:border-slate-700/50 rounded-2xl p-4 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-bold text-slate-100 truncate text-[15px]">
              {session.taskName || "이름 없는 세션"}
            </p>
            <StatusBadge status={entry.status} />
          </div>
          <p className="text-xs text-slate-500">
            {startTime} → {endTime}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/50">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-sm font-semibold text-blue-400">{formatTime(session.focusSeconds)}</span>
          <span className="text-[11px] text-slate-500">집중</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">{focusRate}%</span>
          <span className="text-[11px] text-slate-500">달성</span>
        </div>
        {session.extensionCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">{session.extensionCount}회</span>
            <span className="text-[11px] text-slate-500">연장</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { entries, clearAll } = useHistoryStore();
  const [showConfirm, setShowConfirm] = useState(false);

  // 날짜별로 그룹핑
  const grouped = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};
    entries.forEach((entry) => {
      const date = entry.sessionDate;
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [entries]);

  // 전체 통계
  const totalStats = useMemo(() => {
    const totalFocus = entries.reduce((sum, e) => sum + e.session.focusSeconds, 0);
    const completed = entries.filter((e) => e.status !== "abandoned").length;
    const todayEntries = entries.filter((e) => e.sessionDate === new Date().toISOString().split("T")[0]);
    const todayFocus = todayEntries.reduce((sum, e) => sum + e.session.focusSeconds, 0);
    return { totalFocus, completed, totalSessions: entries.length, todayFocus, todayCount: todayEntries.length };
  }, [entries]);

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "오늘";
    if (dateStr === yesterday) return "어제";
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`;
  };

  return (
    <main className="flex-1 w-full flex flex-col items-center px-4 pt-8 pb-28">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">기록</h1>
            <p className="text-sm text-slate-400 mt-0.5">나의 집중 히스토리</p>
          </div>
          {entries.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="전체 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Today Stats Summary */}
        {entries.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-500/10 border border-blue-500/15 rounded-2xl p-3.5 text-center">
              <Flame className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
              <p className="text-xl font-bold text-blue-400">{totalStats.todayCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">오늘 세션</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-2xl p-3.5 text-center">
              <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-xl font-bold text-emerald-400">{formatTime(totalStats.todayFocus)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">오늘 집중</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/15 rounded-2xl p-3.5 text-center">
              <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
              <p className="text-xl font-bold text-purple-400">{totalStats.totalSessions}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">총 세션</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-5">
              <Clock className="w-9 h-9 text-slate-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-300 mb-2">아직 기록이 없어요</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              타이머를 시작하고 완료하면
              <br />
              여기에 집중 기록이 쌓여요
            </p>
          </div>
        )}

        {/* Grouped List */}
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-400">
                  {formatDateLabel(date)}
                </h3>
                <span className="text-[11px] text-slate-600">{items.length}개 세션</span>
              </div>
              <div className="space-y-2">
                {items.map((entry) => (
                  <HistoryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 전체 삭제 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xs w-full text-center space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white">전체 기록 삭제</h3>
            <p className="text-sm text-slate-400">모든 세션 기록이 삭제됩니다.<br />이 작업은 되돌릴 수 없어요.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => { clearAll(); setShowConfirm(false); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
