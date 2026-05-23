// Wrapped 슬라이드의 첫 장 — "X님의 (음악/게임) 취향을 분석했어요"
// 음악·게임 카드 양쪽에서 재사용 (type prop으로 구분)
'use client';

import CardShell from '../CardShell';
import type { Tone } from '@/lib/wrapped/tones';

interface Props {
  tone: Tone;
  userName?: string;
  userAvatarUrl?: string | null;
  type: 'music' | 'game' | 'movie';
}

const COVER_COPY: Record<Props['type'], { eyebrow: string; footerRight: string; subject: string; sectionLabel: string }> = {
  music: { eyebrow: 'MUSIC WRAPPED · 2026', footerRight: 'POWERED BY SPOTIFY', subject: '음악 취향', sectionLabel: '음악 결산' },
  game: { eyebrow: 'GAMES WRAPPED · 2026', footerRight: 'POWERED BY STEAM', subject: '게임 취향', sectionLabel: '게임 결산' },
  movie: { eyebrow: 'MOVIES WRAPPED · 2026', footerRight: 'POWERED BY NETFLIX', subject: '영화 취향', sectionLabel: '영화 결산' },
};

export default function CoverCard({ tone, userName, userAvatarUrl, type }: Props) {
  const { eyebrow, footerRight, subject, sectionLabel } = COVER_COPY[type];
  const displayName = userName ?? '사용자';

  return (
    <CardShell
      tone={tone}
      eyebrow={eyebrow}
      userName={userName}
      userAvatarUrl={userAvatarUrl}
      footerRight={footerRight}
    >
      {/* 상단 헤드라인 — 큰 연도 */}
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
          {sectionLabel}
        </div>
      </div>

      {/* 가운데 — 아바타 + 사용자 이름 + 카피 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            overflow: 'hidden',
            background: userAvatarUrl
              ? `url(${userAvatarUrl}) center/cover`
              : `linear-gradient(135deg, ${tone.accent}, ${tone.accent2})`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            border: `2px solid ${tone.faint}`,
          }}
        />
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: tone.headline,
            letterSpacing: '-0.02em',
            marginTop: 8,
          }}
        >
          {displayName}님의
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: tone.accent,
            letterSpacing: '-0.02em',
            marginTop: -8,
          }}
        >
          {subject}
        </div>
        <div
          style={{
            fontSize: 14,
            color: tone.muted,
            textAlign: 'center',
            marginTop: 2,
            fontWeight: 500,
          }}
        >
          을 분석했어요
        </div>
      </div>

      {/* 하단 CTA 힌트 */}
      <div style={{ padding: '0 24px 14px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 11,
            color: tone.muted,
            letterSpacing: '0.18em',
            fontWeight: 600,
          }}
        >
          SWIPE TO START →
        </div>
      </div>
    </CardShell>
  );
}
