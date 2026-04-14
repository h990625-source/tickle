-- 카카오 로그인 후 Supabase Auth (auth.users) 연동과 유저 프로필 관리를 위한 테이블 생성 스크립트입니다.
-- Supabase 대시보드의 'SQL Editor' 탭에 복사하여 붙여넣고 실행해 주세요!

-- 1. 사용자 (USERS) 테이블 생성
-- auth.users 와 1:1 관계를 가집니다.
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id TEXT UNIQUE,
  nickname TEXT,
  email TEXT,
  avatar_url TEXT,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS(Row Level Security) 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 프로필만 조회 및 업데이트 가능" 
  ON public.users 
  FOR ALL 
  USING (auth.uid() = id);

-- 사용자가 카카오 로그인으로 가입(Signup)했을 때 자동으로 users 테이블에 값을 넣어주는 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, kakao_id, nickname, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'provider_id',
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 생성 시 트리거 동작
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. 타이머 세션 (SESSIONS) 테이블 생성
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID, -- 나중에 프로젝트 테이블을 만들면 연동
  task_name TEXT DEFAULT '이름 없는 세션',
  status TEXT CHECK (status IN ('completed', 'completed_overtime', 'abandoned')),
  planned_seconds INTEGER NOT NULL CHECK (planned_seconds > 0),
  actual_seconds INTEGER NOT NULL,
  focus_seconds INTEGER NOT NULL,
  pause_seconds INTEGER DEFAULT 0,
  pause_count INTEGER DEFAULT 0,
  extension_count INTEGER DEFAULT 0,
  total_extension_seconds INTEGER DEFAULT 0,
  tab_leave_count INTEGER DEFAULT 0,
  is_streak_valid BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  session_date DATE NOT NULL
);

-- SESSIONS 테이블 RLS 설정
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 세션 기록만 읽고 삽입 가능" 
  ON public.sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- 인덱스 추가 (리포트 검색 성능 향상)
CREATE INDEX idx_sessions_user_date ON public.sessions (user_id, session_date DESC);
