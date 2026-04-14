"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Timer, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimerStore } from "@/store/useTimerStore";

const tabs = [
  { href: "/", icon: Timer, label: "타이머" },
  { href: "/history", icon: ClipboardList, label: "기록" },
  { href: "/profile", icon: User, label: "내 정보" },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const timerStatus = useTimerStore((s) => s.status);

  // 타이머 실행 중이거나 리포트 페이지, 로그인 페이지에서는 탭바 숨김
  const hiddenPaths = ["/report", "/login"];
  const isTimerActive = timerStatus === "running" || timerStatus === "paused" || timerStatus === "timeUp";
  if (isTimerActive || hiddenPaths.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-2 rounded-[22px]",
          // Liquid Glass 효과
          "bg-white/[0.08] backdrop-blur-2xl",
          "border border-white/[0.15]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
        )}
      >
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-300 ease-out",
                isActive
                  ? "bg-white/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)]"
                  : "hover:bg-white/[0.06]"
              )}
            >
              <tab.icon
                className={cn(
                  "w-[20px] h-[20px] transition-colors duration-300",
                  isActive ? "text-white" : "text-white/40"
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {isActive && (
                <span className="text-[13px] font-semibold text-white tracking-tight animate-in fade-in slide-in-from-left-2 duration-200">
                  {tab.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
