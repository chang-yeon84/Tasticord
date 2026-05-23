// Wrapped 슬라이드 마지막 — "끝났어요" + 친구 공유/링크 복사 CTA
// 음악/게임 카드 양쪽에서 재사용 (type prop으로 카피만 분기)
'use client';

import { useState } from 'react';
import CardShell from '../CardShell';
import type { Tone } from '@/lib/wrapped/tones';

interface Props {
  tone: Tone;
  userName?: string;
  userAvatarUrl?: string | null;
  type: 'music' | 'game' | 'movie';
}

const CLOSING_COPY: Record<Props['type'], { footerRight: string; subject: string; ctaLabel: string }> = {
  music: { footerRight: 'POWERED BY SPOTIFY', subject: '음악 취향', ctaLabel: '나도 내 음악 카드 만들기' },
  game: { footerRight: 'POWERED BY STEAM', subject: '게임 취향', ctaLabel: '나도 내 게임 카드 만들기' },
  movie: { footerRight: 'POWERED BY NETFLIX', subject: '영화 취향', ctaLabel: '나도 내 영화 카드 만들기' },
};

export default function ClosingCard({ tone, userName, userAvatarUrl, type }: Props) {
  const eyebrow = 'SHARE';
  const { footerRight, subject, ctaLabel } = CLOSING_COPY[type];

  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한 거부 등 — 조용히 무시
    }
  };

  const handleShare = async () => {
    // Web Share API 지원 시 native share, 아니면 복사로 폴백
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${userName ?? '사용자'}님의 ${subject}`,
          text: `Tasticord에서 만든 ${subject}를 공유합니다`,
          url: shareUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // 사용자가 취소했거나 실패 — 무시
      }
    } else {
      // Web Share 미지원 → 복사로 폴백
      handleCopy();
    }
  };

  const buttonBase: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'var(--font-pretendard)',
    letterSpacing: '-0.01em',
    cursor: 'pointer',
    transition: 'transform 0.1s, opacity 0.15s',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };

  return (
    <CardShell
      tone={tone}
      eyebrow={eyebrow}
      userName={userName}
      userAvatarUrl={userAvatarUrl}
      footerRight={footerRight}
    >
      {/* 상단 헤드라인 */}
      <div style={{ padding: '24px 24px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: tone.muted,
            letterSpacing: '0.16em',
            marginBottom: 12,
          }}
        >
          끝까지 봐주셨네요
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 0.9,
            color: tone.headline,
            letterSpacing: '-0.04em',
          }}
        >
          공유하기
        </h1>
      </div>

      {/* 가운데 메시지 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          gap: 12,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: tone.headline,
            letterSpacing: '-0.02em',
            lineHeight: 1.35,
          }}
        >
          내 {subject}을
          <br />
          친구들에게도 보여주세요
        </div>
        <div
          style={{
            fontSize: 13,
            color: tone.muted,
            marginTop: 4,
          }}
        >
          링크를 복사하거나 바로 공유할 수 있어요
        </div>
      </div>

      {/* 하단 공유 버튼 2개 + 자신의 카드 만들기 CTA (3차) */}
      <div
        style={{
          padding: '0 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={handleShare}
          style={{
            ...buttonBase,
            background: tone.accent,
            color: tone.accentInk,
          }}
        >
          {shared ? '✓ 공유했어요' : ' 친구에게 공유하기'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            ...buttonBase,
            background: tone.chip,
            color: tone.fg,
            border: `1px solid ${tone.chipBorder}`,
          }}
        >
          {copied ? '✓ 링크가 복사됐어요' : ' 링크 복사하기'}
        </button>
        <a
          href="/auth/login"
          style={{
            marginTop: 4,
            textAlign: 'center',
            fontSize: 12,
            color: tone.muted,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          {ctaLabel} →
        </a>
      </div>
    </CardShell>
  );
}
