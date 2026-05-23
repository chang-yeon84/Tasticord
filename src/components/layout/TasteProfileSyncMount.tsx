'use client';

import { useTasteProfileSync } from '@/hooks/useTasteProfileSync';

// (main) 레이아웃에 1번만 마운트되어 24h 경과 시 taste_profiles 스냅샷을 갱신.
export default function TasteProfileSyncMount() {
  useTasteProfileSync();
  return null;
}
