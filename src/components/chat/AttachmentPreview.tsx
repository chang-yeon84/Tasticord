'use client';

import { X } from 'lucide-react';
import type { EmbedType } from '@/types';

/**
 * 입력창 위에 표시되는 첨부 카드 미리보기 컴포넌트
 *
 * 플로우:
 * 1. 바텀 시트에서 아이템 선택 → 이 컴포넌트 표시
 * 2. 사용자가 X 버튼 클릭 → onCancel 호출되어 사라짐
 * 3. 전송 버튼 클릭 시 카드 메시지로 발송
 */

interface AttachmentPreviewProps {
  embedType: EmbedType;
  embedData: Record<string, unknown>;
  onCancel: () => void;
}

export default function AttachmentPreview({ embedType, embedData, onCancel }: AttachmentPreviewProps) {
  const title = (embedData.title as string) || '';
  const imageUrl = embedData.image_url as string | undefined;

  // 타입별 아이콘과 부제목
  const config = {
    music: { icon: '🎵', subtitle: (embedData.artist as string) || '음악' },
    game: { icon: '🎮', subtitle: 'Steam 게임' },
    movie: { icon: '🎬', subtitle: '영화/드라마' },
  }[embedType || 'music'];

  return (
    <div className="mx-4 mb-2 flex items-center gap-3 p-3 rounded-xl border border-zinc-700/60 bg-zinc-900/80">
      {/* 타입 아이콘 */}
      <span className="text-lg">{config.icon}</span>

      {/* 썸네일 */}
      <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : null}
      </div>

      {/* 제목 + 부제목 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-zinc-500 truncate">{config.subtitle}</p>
      </div>

      {/* 취소 버튼 */}
      <button
        onClick={onCancel}
        className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-zinc-400 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
