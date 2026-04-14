"use client";

import { useTimerStore } from "@/store/useTimerStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { saveSessionToSupabase } from "@/lib/supabase/sessions";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/utils";
import { Check, RefreshCw, Copy, ClipboardList, Cloud, CloudOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function ReportPage() {
  const { session, status, resetTimer } = useTimerStore();
  const addEntry = useHistoryStore((s) => s.addEntry);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [cloudSaved, setCloudSaved] = useState<boolean | null>(null);
  const savedRef = useRef(false);

  // 세션을 히스토리에 저장 (한 번만)
  useEffect(() => {
    if (savedRef.current) return;
    if (!session.startedAt) return;
    savedRef.current = true;

    const historyStatus = session.extensionCount > 0
      ? 'completed_overtime' as const
      : status === 'abandoned'
        ? 'abandoned' as const
        : 'completed' as const;

    // localStorage 저장
    addEntry(session, historyStatus);

    // Supabase 저장 (로그인된 경우만)
    saveSessionToSupabase(session, historyStatus).then((result) => {
      setCloudSaved(result.success);
    });
  }, [session, status, addEntry]);

  const handleHome = () => {
    resetTimer();
    router.push("/");
  };

  const generateJSON = () => {
    return JSON.stringify({
      date: new Date().toISOString().split("T")[0],
      summary: {
        totalFocusTime: session.focusSeconds,
        totalSessions: 1,
        completedSessions: session.endedAt && !session.pauseSeconds ? 1 : 0, // Mock
        abandonedSessions: 0,
        overtimeSessions: session.extensionCount > 0 ? 1 : 0,
        totalExtensions: session.extensionCount,
        completionRate: 100,
        streak: 1
      },
      sessions: [session]
    }, null, 2);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateJSON());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  return (
    <main className="flex-1 w-full flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">셧다운 리포트</h1>
          <p className="text-slate-400">오늘의 몰입 기록이 정리되었습니다.</p>
          {cloudSaved !== null && (
            <div className={`inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1 rounded-full ${cloudSaved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              {cloudSaved ? <Cloud size={14} /> : <CloudOff size={14} />}
              {cloudSaved ? '클라우드 저장됨' : '로컬에만 저장됨'}
            </div>
          )}
        </div>

        <div className="glass rounded-3xl p-6 md:p-8 space-y-8">
          {/* Summary Card */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 flex flex-wrap gap-4 items-center justify-between text-center md:text-left">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">순수 집중 시간</p>
              <p className="text-3xl font-bold text-blue-400">{formatTime(session.focusSeconds)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">연장 횟수</p>
              <p className="text-3xl font-bold text-amber-400">{session.extensionCount}회</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">끊김 횟수</p>
              <p className="text-3xl font-bold text-red-400">{session.pauseCount}회</p>
            </div>
          </div>

          {/* Session List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-300">세션 상세</h2>
            <div className="bg-slate-800/40 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Check size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-200 truncate">
                  {session.taskName || "이름 없는 세션"}
                </p>
                <p className="text-sm text-slate-400">
                  계획 {formatTime(session.plannedSeconds)} / 집중 {formatTime(session.focusSeconds)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                  <RefreshCw size={12} /> {session.extensionCount}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-slate-700">
            <button
              onClick={copyToClipboard}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              {copied ? "복사됨!" : "JSON 복사"}
            </button>
            <button
              onClick={() => { resetTimer(); router.push("/history"); }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <ClipboardList size={18} />
              기록 보기
            </button>
            <button
              onClick={handleHome}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-colors shadow-lg shadow-blue-500/20"
            >
              새 세션
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
