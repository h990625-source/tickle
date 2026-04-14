"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError("로그인 중 오류가 발생했습니다.");
        setIsLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full">
        {/* 로고 & 타이틀 */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            DeepFlow
          </h1>
          <p className="text-slate-400 text-center text-sm leading-relaxed">
            진짜 몰입한 시간을 보여주는
            <br />
            딥워크 집중 타이머
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="w-full rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 p-6 shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-100">
                시작하기
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                카카오 계정으로 간편하게 로그인하세요
              </p>
            </div>

            {/* 카카오 로그인 버튼 */}
            <button
              id="kakao-login-button"
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-[15px] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#FEE500",
                color: "rgba(0, 0, 0, 0.85)",
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
              ) : (
                <>
                  {/* 카카오 말풍선 심볼 */}
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.113 4.508 6.459-.199.742-.72 2.687-.825 3.104-.131.526.192.52.404.378.166-.11 2.641-1.793 3.713-2.52.698.104 1.422.16 2.166.16 5.523 0 10-3.463 10-7.691C22 6.463 17.523 3 12 3z" />
                  </svg>
                  <span>카카오 로그인</span>
                </>
              )}
            </button>

            {/* 에러 메시지 */}
            {error && (
              <p className="text-red-400 text-xs text-center animate-in fade-in">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* 하단 안내 */}
        <p className="text-[11px] text-slate-600 text-center leading-relaxed">
          로그인 시{" "}
          <span className="text-slate-500">서비스 이용약관</span> 및{" "}
          <span className="text-slate-500">개인정보 처리방침</span>에
          동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}
