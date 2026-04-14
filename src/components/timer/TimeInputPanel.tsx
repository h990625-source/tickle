"use client";

import { useState } from "react";
import { useTimerStore } from "@/store/useTimerStore";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimeInputPanel() {
  const [h, setH] = useState("");
  const [m, setM] = useState("");
  const [s, setS] = useState("");
  
  const { session, setTaskName, setPlannedSeconds, startTimer } = useTimerStore();

  const totalSeconds = (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0);

  const handleStart = () => {
    if (totalSeconds <= 0) return;
    setPlannedSeconds(totalSeconds);
    startTimer();
  };

  const handlePreset = (minutes: number) => {
    setPlannedSeconds(minutes * 60);
    startTimer();
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          DeepFlow
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          진짜 몰입한 시간을 보여주는 타이머
        </p>
      </div>

      <div className="w-full glass rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden">
        {/* Subtle glow background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10" />

        {/* Time Inputs */}
        <div className="flex items-end justify-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              placeholder="00"
              value={h}
              onChange={(e) => setH(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              className="w-16 h-20 bg-slate-900/50 border border-slate-700 rounded-xl text-center text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            />
            <span className="text-xs text-slate-500 font-medium">시간</span>
          </div>
          <span className="text-2xl font-bold text-slate-600 pb-8">:</span>
          <div className="flex flex-col items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              placeholder="00"
              value={m}
              onChange={(e) => setM(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              className="w-16 h-20 bg-slate-900/50 border border-slate-700 rounded-xl text-center text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            />
            <span className="text-xs text-slate-500 font-medium">분</span>
          </div>
          <span className="text-2xl font-bold text-slate-600 pb-8">:</span>
          <div className="flex flex-col items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              placeholder="00"
              value={s}
              onChange={(e) => setS(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              className="w-16 h-20 bg-slate-900/50 border border-slate-700 rounded-xl text-center text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            />
            <span className="text-xs text-slate-500 font-medium">초</span>
          </div>
        </div>

        <div className="text-center text-sm font-medium text-blue-400 h-5">
          {totalSeconds > 0 ? `→ 총 ${totalSeconds}초` : ""}
        </div>

        {/* Task Name */}
        <div className="space-y-2">
          <input
            type="text"
            value={session.taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="무엇에 집중하시나요? (선택)"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Presets */}
        <div className="flex gap-2 justify-center">
          {[25, 60, 90].map((mins) => (
            <button
              key={mins}
              onClick={() => handlePreset(mins)}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors"
            >
              {mins}분
            </button>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={totalSeconds <= 0}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300",
            totalSeconds > 0 
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          )}
        >
          <Play className="w-5 h-5 fill-current" />
          START
        </button>
      </div>
    </div>
  );
}
