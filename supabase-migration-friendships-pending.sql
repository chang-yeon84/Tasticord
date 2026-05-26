-- friendships 에 status (pending/accepted) 도입
-- 자체 친구 추가 시스템 (검색→요청→수락) + 초대 링크 자동 요청용
--
-- 기본값 'accepted'라 기존 카카오 sync 행은 자동 수락 상태 유지(파괴적 변경 없음).
-- 친구 요청은 (sender, receiver, 'pending') 단방향 1행으로 표현.
-- 수락 시 그 행을 'accepted'로 업데이트 + 반대 방향 (receiver, sender, 'accepted') INSERT.

ALTER TABLE friendships
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted'));

-- 받은 요청 빠르게 — friend_id로 pending 조회
CREATE INDEX IF NOT EXISTS idx_friendships_incoming_pending
  ON friendships (friend_id, status)
  WHERE status = 'pending';

-- 내가 보낸 요청 + 친구 목록 조회는 기존 user_id 인덱스 활용

-- ── RLS 정책 ────────────────────────────────────────────────
-- 기존 SELECT 정책: user_id = me 인 행만 — 받은 요청(friend_id=me) 못 봄
-- → incoming pending도 보이도록 확장
DROP POLICY IF EXISTS "Users can read own friendships" ON friendships;
CREATE POLICY "Users can read own friendships" ON friendships FOR SELECT USING (
  auth.uid() = user_id
  OR (auth.uid() = friend_id AND status = 'pending')
);

-- 신규 친구 시스템의 INSERT/UPDATE/DELETE는 API 라우트가 admin client로 처리
-- (기존 카카오 sync도 admin 사용 — 일관성 유지).
-- 따라서 별도 INSERT/UPDATE/DELETE RLS 정책은 추가하지 않음.
