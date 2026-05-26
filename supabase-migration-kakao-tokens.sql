-- profiles에 카카오 토큰 보관 컬럼 추가
-- 목적: Supabase가 자동 갱신해주지 않는 OAuth provider_token을 직접 refresh 하기 위함.
--   Kakao access token은 ~6시간 만료 → 만료 시 refresh_token으로 새 access 발급
--   (Spotify에 적용된 동일 패턴을 카카오에도 도입)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS kakao_access_token TEXT,
  ADD COLUMN IF NOT EXISTS kakao_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS kakao_token_expires_at TIMESTAMPTZ;
