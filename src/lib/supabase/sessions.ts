import { createClient } from "@/lib/supabase/client";
import type { TimerSessionData } from "@/store/useTimerStore";

export type SessionStatus = "completed" | "completed_overtime" | "abandoned";

/**
 * 완료된 세션을 Supabase sessions 테이블에 저장합니다.
 * 로그인된 사용자만 저장 가능 (RLS 정책 적용)
 */
export async function saveSessionToSupabase(
  session: TimerSessionData,
  status: SessionStatus
) {
  const supabase = createClient();

  // 현재 로그인된 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("[DeepFlow] 로그인되지 않음 - Supabase 저장 건너뜀");
    return { success: false, reason: "not_authenticated" };
  }

  const { data, error } = await supabase.from("sessions").insert({
    user_id: user.id,
    task_name: session.taskName || "이름 없는 세션",
    status,
    planned_seconds: session.plannedSeconds,
    actual_seconds: session.actualSeconds,
    focus_seconds: session.focusSeconds,
    pause_seconds: session.pauseSeconds,
    pause_count: session.pauseCount,
    extension_count: session.extensionCount,
    total_extension_seconds: session.totalExtensionSeconds,
    tab_leave_count: session.tabLeaveCount,
    is_streak_valid: status !== "abandoned" && session.focusSeconds >= session.plannedSeconds * 0.8,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    session_date: new Date().toISOString().split("T")[0],
  }).select().single();

  if (error) {
    console.error("[DeepFlow] Supabase 저장 실패:", error.message);
    return { success: false, reason: error.message };
  }

  console.log("[DeepFlow] Supabase 저장 성공:", data?.id);
  return { success: true, data };
}

/**
 * 로그인된 사용자의 세션 기록을 Supabase에서 가져옵니다.
 */
export async function fetchSessionsFromSupabase(limit = 50) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("session_date", { ascending: false })
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[DeepFlow] 세션 조회 실패:", error.message);
    return [];
  }

  return data ?? [];
}
