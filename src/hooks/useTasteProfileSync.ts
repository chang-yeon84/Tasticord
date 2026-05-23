'use client';

import { useEffect } from 'react';

/**
 * 앱 접속 시 본인 taste_profiles 스냅샷을 백그라운드로 갱신 요청.
 * - 실제 24h 가드는 서버(/api/taste-profile/refresh)에서 수행 (fresh면 즉시 스킵)
 * - 클라이언트도 localStorage로 6h 쓰로틀 — 잦은 페이지 재진입 시 불필요한 호출 차단
 * (main) 레이아웃에서 1번만 마운트.
 */
const CLIENT_THROTTLE_MS = 6 * 60 * 60 * 1000; // 6h
const LS_KEY = 'tasticord:taste-profile:lastPing';

export function useTasteProfileSync() {
  useEffect(() => {
    let cancelled = false;

    const last = Number(localStorage.getItem(LS_KEY) ?? 0);
    if (Date.now() - last < CLIENT_THROTTLE_MS) return;

    (async () => {
      try {
        await fetch('/api/taste-profile/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!cancelled) localStorage.setItem(LS_KEY, String(Date.now()));
      } catch {
        // 실패해도 다음 접속 때 재시도 — 조용히 무시
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
