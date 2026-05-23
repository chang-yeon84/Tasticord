// 영화 카드 3 — 가장 많이 본 장르 스포트라이트 (SINGLE BIG 템플릿)
// 큰 장르명 + 작품 수 카운트업
'use client';

import { useEffect, useState } from 'react';
import CardShell from '../../CardShell';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedTopGenre } from '@/lib/wrapped/movie-types';

interface Props {
  tone: Tone;
  data: WrappedTopGenre;
  userName?: string;
  userAvatarUrl?: string | null;
}

const COUNT_UP_MS = 1400;

export default function TopGenre({ tone, data, userName, userAvatarUrl }: Props) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / COUNT_UP_MS, 1);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const animatedCount = Math.round(data.count * progress);
  const animatedPct = Math.round(data.pct * progress);
  const nameLen = data.name.length;
  const nameFontSize = nameLen >= 8 ? 56 : nameLen >= 5 ? 72 : 88;

  return (
    <CardShell tone={tone} eyebrow="TOP GENRE" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY NETFLIX">
      <div style={{ padding: '28px 24px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: tone.muted,
            letterSpacing: '0.16em',
            marginBottom: 10,
          }}
        >
          당신을 가장 많이 사로잡은
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          올해의 장르
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '0 24px',
        }}
      >
        <div
          style={{
            fontSize: nameFontSize,
            fontWeight: 800,
            lineHeight: 0.95,
            color: tone.accent,
            letterSpacing: '-0.04em',
            textAlign: 'center',
          }}
        >
          {data.name}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 0.85,
              color: tone.headline,
              letterSpacing: '-0.05em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {animatedCount}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: tone.headline,
              letterSpacing: '-0.02em',
            }}
          >
            편
          </div>
        </div>
        <div
          style={{
            fontSize: 14,
            color: tone.muted,
            fontWeight: 500,
          }}
        >
          전체 시청의 <span style={{ color: tone.headline, fontWeight: 700 }}>{animatedPct}%</span>가 이 장르였어요
        </div>
      </div>

      <div style={{ padding: '14px 24px 14px' }}>
        <div style={{ fontSize: 12, color: tone.muted, lineHeight: 1.5, textAlign: 'center' }}>
          취향은 결국 한 방향으로 흐르네요.
        </div>
      </div>
    </CardShell>
  );
}
