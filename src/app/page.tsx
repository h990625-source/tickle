"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTimerStore } from "@/store/useTimerStore";
import TimeInputPanel from "@/components/timer/TimeInputPanel";
import CountdownView from "@/components/timer/CountdownView";

export default function TimerPage() {
  const status = useTimerStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "report") {
      router.push("/report");
    }
  }, [status, router]);

  return (
    <main className="flex-1 w-full flex flex-col items-center justify-center relative px-4 py-12 md:py-24">
      {status === "idle" ? <TimeInputPanel /> : <CountdownView />}
    </main>
  );
}
