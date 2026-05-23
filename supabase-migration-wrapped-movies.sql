-- Tasticord Wrapped Movies (영화 취향 카드) 테이블 마이그레이션
-- Supabase SQL Editor에서 실행
--
-- 음악(wrapped_reports)·게임(wrapped_games_reports)과 평행 구조.
-- 데이터 소스: netflix_history (CSV 업로드 시점에 TMDB 포스터/장르 enrichment 완료)
--   → 카드 생성 시 외부 API 호출 없이 로컬 DB 집계만 수행
-- 공유 URL: /wrapped-movies/[userId] — 비로그인자도 조회 가능
--
-- 카드 구성 (6장):
--   0. Cover
--   1. recent_movies   : 최근 본 작품 포스터 그리드 (date_watched desc)
--   2. genre_mix        : 장르 도넛 (metadata.genres 빈도 집계)
--   3. top_genre        : 가장 많이 본 장르 1개 스포트라이트
--   4. total_watched    : 총 본 작품 수 + 영화/시리즈 비율
--   5. Closing

-- ── 선행: netflix_history.poster_url 컬럼 ─────────────────────────────
-- upload route(/api/netflix/upload)가 이미 poster_url 컬럼을 select/insert 중이나
-- supabase-schema.sql 정의에는 빠져 있음 → 누락 컬럼 보강 (idempotent)
ALTER TABLE netflix_history ADD COLUMN IF NOT EXISTS poster_url TEXT;

-- ── wrapped_movies_reports ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wrapped_movies_reports (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'A' CHECK (tone IN ('A', 'B', 'C')),
  -- recent_movies: [{ title, poster_url, date_watched, media_type }, ...]
  recent_movies JSONB NOT NULL DEFAULT '[]',
  -- genre_mix: [{ name, pct, color }, ...]  (pct 합 = 100)
  genre_mix JSONB NOT NULL DEFAULT '[]',
  -- top_genre: { name, count, pct } | null
  top_genre JSONB,
  -- total_watched: { total, movies, series } | null
  total_watched JSONB,
  -- 푸터 캐시 (생성 시점 닉네임/아바타)
  nickname TEXT,
  avatar_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wrapped_movies_reports ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (공유 링크는 공개)
DROP POLICY IF EXISTS "Anyone can read wrapped movies" ON wrapped_movies_reports;
CREATE POLICY "Anyone can read wrapped movies" ON wrapped_movies_reports FOR SELECT USING (true);

-- 본인만 생성/수정/삭제
DROP POLICY IF EXISTS "Users can manage own wrapped movies" ON wrapped_movies_reports;
CREATE POLICY "Users can manage own wrapped movies" ON wrapped_movies_reports
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
