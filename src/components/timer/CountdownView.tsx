"use client";

import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "@/store/useTimerStore";
import { Pause, Play, Square, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CountdownView() {
  const router = useRouter();
  const {
    status,
    session,
    pauseTimer,
    resumeTimer,
    extendTimer,
    markTimeUp,
    completeTimer,
    abandonTimer,
    updateTick
  } = useTimerStore();

  const [displaySeconds, setDisplaySeconds] = useState(
    Math.max(0, session.plannedSeconds - session.actualSeconds)
  );
  const [showSecondsOnly, setShowSecondsOnly] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const reqRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(
    Math.max(0, session.plannedSeconds - session.actualSeconds)
  );
  const focusTimeAccumulator = useRef<number>(0);
  
  const waterRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  useEffect(() => {
    lastTickRef.current = Date.now();
    
    const tick = () => {
      if (status !== "running") return;
      
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      const deltaSec = deltaMs / 1000;
      lastTickRef.current = now;

      remainingRef.current -= deltaSec;
      focusTimeAccumulator.current += deltaSec;
      
      if (remainingRef.current <= 0) {
        remainingRef.current = 0;
        setDisplaySeconds(0);
        updateProgressBars(0);
        
        // Sync final time to store before timeUp
        updateTick(focusTimeAccumulator.current, 0);
        focusTimeAccumulator.current = 0;
        markTimeUp();
        
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
        return;
      }

      // Update React state max once per second
      const rounded = Math.ceil(remainingRef.current);
      if (rounded !== displaySeconds) {
        setDisplaySeconds(rounded);
        // Sync with store roughly once per second to keep data accurate without spamming store updates
        if (focusTimeAccumulator.current >= 0.5) {
          updateTick(focusTimeAccumulator.current, 0);
          focusTimeAccumulator.current = 0;
        }
      }

      // Update 60fps animations directly bypassing React state
      const percentage = remainingRef.current / session.plannedSeconds;
      updateProgressBars(percentage);

      reqRef.current = requestAnimationFrame(tick);
    };

    if (status === "running") {
      reqRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      // Sync any remaining delta when unmounting/stopping to keep Zustand accurate
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      if (status === "running") {
        updateTick(focusTimeAccumulator.current + (deltaMs / 1000), 0);
        focusTimeAccumulator.current = 0;
      }
    };
  }, [status, session.plannedSeconds]);

  // Handle Tab visibility for 'tab leave' tracking
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && status === "running") {
        useTimerStore.getState().recordTabLeave();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status]);


  const updateProgressBars = (percentage: number) => {
    waterRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const delayedPercentage = Math.max(0, Math.min(1, percentage * (1 + i * 0.05)));
      bar.style.transform = `scaleY(${delayedPercentage})`;
    });
  };

  const handlePauseResume = () => {
    if (status === "running") pauseTimer();
    else if (status === "paused" && !showStopConfirm) resumeTimer();
  };

  const handleStopRequest = () => {
    // 타이머 일시정지 + 확인 팝업 표시
    if (status === "running") pauseTimer();
    setShowStopConfirm(true);
  };

  const handleStopConfirm = () => {
    setShowStopConfirm(false);
    completeTimer();
  };

  const handleStopCancel = () => {
    setShowStopConfirm(false);
    resumeTimer();
  };

  const formatLargeTime = (totalS: number) => {
    if (showSecondsOnly) {
      return Math.floor(totalS).toString();
    }
    const m = Math.floor(totalS / 60);
    const s = Math.floor(totalS % 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h}:${(m % 60).toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const renderWaterBars = () => {
    return Array.from({ length: 7 }).map((_, i) => (
      <div 
        key={i} 
        className="flex-1 max-w-[40px] bg-slate-800/50 rounded-full overflow-hidden relative shadow-inner"
      >
        <div
          ref={(el) => { waterRefs.current[i] = el; }}
          className={cn(
            "absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-t origin-bottom rounded-full transition-transform duration-75",
            displaySeconds < 60 
               ? "from-red-600/80 to-red-400" 
               : "from-blue-600/80 to-blue-400"
          )}
          style={{ transform: `scaleY(${remainingRef.current / session.plannedSeconds})` }}
        />
        <div className="absolute inset-0 bg-white/10 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] mix-blend-overlay" />
      </div>
    ));
  };

  if (status === "timeUp" || status === "completed" || status === "abandoned") {
    // Time's up modal / End state
    return (
      <div className="w-full max-w-md animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 glass rounded-3xl p-8 text-center space-y-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white">
          {status === "timeUp" ? "⏰ 시간 종료!" : "✅ 기록이 저장되었습니다"}
        </h2>
        
        {status === "timeUp" && (
          <div className="w-full flex justify-between gap-4">
            <button
              onClick={completeTimer}
              className="flex-1 py-4 bg-green-500 hover:bg-green-400 rounded-xl text-white font-bold flex flex-col items-center gap-2"
            >
              <Check size={24} />
              완료
            </button>
            <button
              onClick={() => {
                remainingRef.current += 300;
                lastTickRef.current = Date.now();
                extendTimer(300);
              }}
              className="flex-1 py-4 bg-blue-500 hover:bg-blue-400 rounded-xl text-white font-bold flex flex-col items-center gap-2"
            >
              <Plus size={24} />
              +5분 연장
            </button>
          </div>
        )}

        {(status === "completed" || status === "abandoned" || status === "timeUp") && (
          <button
            onClick={() => {
              useTimerStore.getState().goToReport();
              router.push("/report");
            }}
            className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold mt-4"
          >
            리포트 보기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-4">
      {/* Extension Badge */}
      {session.extensionCount > 0 && (
        <div className="absolute top-8 bg-blue-500/20 border border-blue-500/50 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium animate-pulse flex items-center gap-2">
          🔄 ×{session.extensionCount} (+{Math.floor(session.totalExtensionSeconds / 60)}분)
        </div>
      )}

      {/* Background Water Bars */}
      <div className="absolute inset-0 -z-10 p-8 pt-24 md:p-16 flex gap-4 md:gap-8 justify-center h-[90vh]">
        {renderWaterBars()}
      </div>

      {/* Huge Timer */}
      <div className="relative text-center w-full z-10">
        <h1 
          onClick={() => setShowSecondsOnly(!showSecondsOnly)}
          className={cn(
            "cursor-pointer hover:opacity-80 text-[120px] md:text-[180px] font-black tracking-tighter leading-none tabular-nums drop-shadow-2xl transition-all duration-500",
            displaySeconds < 60 ? "text-red-400" : "text-white"
          )}
          style={{ textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
          title="클릭하여 초/분 전환"
        >
          {formatLargeTime(displaySeconds)}
          {showSecondsOnly && <span className="text-4xl md:text-6xl text-white/50 ml-2 font-bold animate-in fade-in">s</span>}
        </h1>
        {session.taskName && (
          <p className="text-xl md:text-2xl text-slate-300 font-medium mt-4 glass px-6 py-2 rounded-full inline-block">
            {session.taskName}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="fixed bottom-12 flex items-center gap-6 glass px-8 py-4 rounded-full z-20">
        <button
          onClick={handleStopRequest}
          className="p-4 rounded-full bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all"
        >
          <Square className="w-6 h-6 fill-current" />
        </button>
        
        <button
          onClick={handlePauseResume}
          className={cn(
            "p-6 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
            status === "paused" ? "bg-amber-500 shadow-amber-500/50" : "bg-blue-600 shadow-blue-500/50"
          )}
        >
          {status === "paused" ? (
            <Play className="w-8 h-8 fill-current" />
          ) : (
            <Pause className="w-8 h-8 fill-current" />
          )}
        </button>
      </div>
      
      {/* Paused Overlay */}
      {status === "paused" && !showStopConfirm && (
        <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in pointer-events-none">
          <p className="text-3xl font-bold text-white tracking-widest uppercase">Paused</p>
        </div>
      )}

      {/* 기록 종료 확인 모달 */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xs w-full text-center space-y-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <Square className="w-6 h-6 text-red-400 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">기록을 정말 종료하시겠어요?</h3>
              <p className="text-sm text-slate-400 mt-1.5">현재까지의 집중 기록이 저장됩니다.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleStopCancel}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
              >
                계속하기
              </button>
              <button
                onClick={handleStopConfirm}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
              >
                기록 종료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
