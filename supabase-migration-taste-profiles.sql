-- Tasticord 취향 프로필 (친구 비교용 스냅샷) 테이블 마이그레이션
-- Supabase SQL Editor에서 실행
--
-- 목적: 친구 페이지에서 "내 취향 vs 친구 취향" 비교를 빠르게 하기 위한 denormalized 스냅샷.
--   wrapped_reports를 직접 비교하지 않는 이유:
--     1. wrapped는 사용자가 "카드 만들기"를 눌러야만 생성됨 (없을 수 있음)
--     2. wrapped는 Top 5만 저장 → 비교 표본이 빈약
--   taste_profiles는 앱 접속 시 24h 경과하면 백그라운드로 자동 갱신 (NowPlayingSync 패턴)
--
-- JSONB 구조 (각 축):
--   music  : { artists: string[], genres: string[] }   -- Spotify Top Artists(이름) + 장르
--   games  : { games: string[],   genres: string[] }   -- Steam 플레이타임 상위 게임명 + 장르
--   movies : { titles: string[],  genres: string[] }   -- Netflix 최근 작품명 + 장르
--   비연동/데이터 없음 축은 빈 배열로 둠

CREATE TABLE IF NOT EXISTS taste_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  music JSONB NOT NULL DEFAULT '{"artists":[],"genres":[]}',
  games JSONB NOT NULL DEFAULT '{"games":[],"genres":[]}',
  movies JSONB NOT NULL DEFAULT '{"titles":[],"genres":[]}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE taste_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 + 친구 프로필 읽기 (비교는 양쪽 프로필이 필요)
DROP POLICY IF EXISTS "Users can read friend taste profiles" ON taste_profiles;
CREATE POLICY "Users can read friend taste profiles" ON taste_profiles FOR SELECT USING (
  auth.uid() = user_id OR
  user_id IN (SELECT friend_id FROM friendships WHERE user_id = auth.uid())
);

-- 본인 행만 생성/수정 (갱신 endpoint는 service-role 사용하므로 RLS 우회되지만 명시)
DROP POLICY IF EXISTS "Users can manage own taste profile" ON taste_profiles;
CREATE POLICY "Users can manage own taste profile" ON taste_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_taste_profiles_updated_at ON taste_profiles(updated_at);
