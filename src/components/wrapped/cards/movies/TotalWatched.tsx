// 영화 카드 4 — 총 시청량 (SINGLE BIG NUMBER + 영화/시리즈 분할)
// 큰 작품 수 + 영화 vs 시리즈 비율 바
'use client';

import { useEffect, useState } from 'react';
import CardShell from '../../CardShell';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedTotalWatched } from '@/lib/wrapped/movie-types';

interface Props {
  tone: Tone;
  data: WrappedTotalWatched;
  userName?: string;
  userAvatarUrl?: string | null;
}

const COUNT_UP_MS = 1400;

export default function TotalWatched({ tone, data, userName, userAvatarUrl }: Props) {
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

  const animatedTotal = Math.round(data.total * progress);
  const digits = String(data.total).length;
  const fontSize = digits >= 4 ? 100 : digits >= 3 ? 124 : 140;

  // 영화/시리즈 분류된 것만으로 비율 바 계산 (media_type null 제외)
  const classified = data.movies + data.series;
  const moviePct = classified > 0 ? Math.round((data.movies / classified) * 100) : 0;
  const seriesPct = classified > 0 ? 100 - moviePct : 0;

  return (
    <CardShell tone={tone} eyebrow="TOTAL WATCHED" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY NETFLIX">
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
          당신이 떠난 이야기의 수
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 0.95,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          이만큼 봤어요
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div
            style={{
              fontSize,
              fontWeight: 800,
              lineHeight: 0.85,
              color: tone.accent,
              letterSpacing: '-0.05em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {animatedTotal.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: tone.accent,
              letterSpacing: '-0.02em',
            }}
          >
            편
          </div>
        </div>

        {classified > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: 14,
                borderRadius: 999,
                overflow: 'hidden',
                background: tone.chip,
              }}
            >
              <div style={{ width: `${moviePct}%`, background: tone.accent }} />
              <div style={{ width: `${seriesPct}%`, background: tone.accent2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: tone.fg, fontWeight: 600 }}>
                <span style={{ color: tone.accent }}>●</span> 영화 {data.movies}편
              </span>
              <span style={{ color: tone.fg, fontWeight: 600 }}>
                시리즈 {data.series}편 <span style={{ color: tone.accent2 }}>●</span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 24px 14px' }}>
        <div style={{ fontSize: 12, color: tone.muted, lineHeight: 1.5, textAlign: 'center' }}>
          이만큼의 세계를 당신은 지나왔어요.
        </div>
      </div>
    </CardShell>
  );
}
