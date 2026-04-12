'use client';

import type { EmbedType } from '@/types';

/**
 * 채팅방에서 카드 메시지를 렌더링하는 컴포넌트
 *
 * embed_type에 따라 다른 스타일의 카드 UI를 보여주고,
 * 전체 카드 클릭 시 해당 플랫폼의 URL로 새 탭에서 이동합니다.
 *
 * - music: Spotify 트랙 (보라색 계열)
 * - game: Steam 게임 (파란색 계열)
 * - movie: 넷플릭스 작품 (빨간색 계열)
 */

interface MessageCardProps {
  embedType: EmbedType;
  embedData: Record<string, unknown>;
  isOwn: boolean;
}

export default function MessageCard({ embedType, embedData, isOwn }: MessageCardProps) {
  // 공통 필드 추출
  const title = (embedData.title as string) || '알 수 없음';
  const imageUrl = embedData.image_url as string | undefined;
  const url = embedData.url as string | undefined;

  // 타입별 설정: 부제목, 호버 색상
  const config = {
    music: {
      subtitle: (embedData.artist as string) || '',
      hoverRing: 'hover:ring-green-500/50',
    },
    game: {
      subtitle: 'Steam',
      hoverRing: 'hover:ring-blue-500/50',
    },
    movie: {
      subtitle: '넷플릭스',
      hoverRing: 'hover:ring-red-500/50',
    },
  }[embedType || 'music'];

  const { subtitle, hoverRing } = config;

  // 이미지 로드 실패 시 텍스트 fallback 처리
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.img-fallback')) {
      const fallback = document.createElement('div');
      fallback.className = 'img-fallback w-full h-full bg-zinc-800 flex items-center justify-center p-2';
      fallback.innerHTML = `<span class="text-xs text-zinc-400 text-center font-medium">${title}</span>`;
      parent.appendChild(fallback);
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block w-[260px] rounded-2xl overflow-hidden ring-1 ring-transparent transition ${hoverRing} ${
        isOwn ? 'bg-purple-700/30' : 'bg-zinc-800/80'
      }`}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-[3/2] bg-zinc-900 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={handleImgError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3">
            <span className="text-sm text-zinc-500 text-center font-medium">{title}</span>
          </div>
        )}
      </div>

      {/* 제목 + 부제목 */}
      <div className="px-4 py-3">
        <p className="font-semibold text-sm truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-zinc-400 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
    </a>
  );
}
