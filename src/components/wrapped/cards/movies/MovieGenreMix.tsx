// 영화 카드 2 — 장르 도넛 (CHART 템플릿)
// 게임 GenreMix와 동일 패턴 — 작품 수 기반 장르 비율, mount 시 시계방향 채움 애니메이션
'use client';

import { useEffect, useState } from 'react';
import CardShell from '../../CardShell';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedMovieGenre } from '@/lib/wrapped/movie-types';

interface Props {
  tone: Tone;
  genres: WrappedMovieGenre[];
  userName?: string;
  userAvatarUrl?: string | null;
}

const ANIM_DURATION_MS = 1200;

export default function MovieGenreMix({ tone, genres, userName, userAvatarUrl }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / ANIM_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // 각 슬라이스 앞까지의 누적 % (재할당 없이 함수형으로 — react-hooks/immutability)
  const cumBefore = (idx: number) =>
    genres.slice(0, idx).reduce((s, x) => s + x.pct, 0);

  const stops: string[] = genres.map((g, i) => {
    const acc = cumBefore(i);
    const start = acc * progress;
    const end = (acc + g.pct) * progress;
    return `${g.color} ${start}% ${end}%`;
  });

  let conic: string;
  if (stops.length === 0) {
    conic = `conic-gradient(from -90deg, ${tone.chip} 0% 100%)`;
  } else if (progress < 1) {
    conic = `conic-gradient(from -90deg, ${stops.join(', ')}, ${tone.chip} ${100 * progress}% 100%)`;
  } else {
    conic = `conic-gradient(from -90deg, ${stops.join(', ')})`;
  }

  const top = genres[0];
  const animatedTopPct = Math.round((top?.pct ?? 0) * progress);

  const labelInfos = genres.map((g, idx) => {
    const sliceStart = cumBefore(idx);
    const sliceMid = sliceStart + g.pct / 2;
    const conicAngleDeg = sliceMid * 3.6 - 90;
    const conicAngleRad = (conicAngleDeg * Math.PI) / 180;
    const x = 120 + 90 * Math.sin(conicAngleRad);
    const y = 120 - 90 * Math.cos(conicAngleRad);
    const fadeStart = sliceStart / 100;
    const fadeMid = (sliceStart + g.pct / 2) / 100;
    const opacity = Math.max(0, Math.min(1, (progress - fadeStart) / Math.max(0.01, fadeMid - fadeStart)));
    return { name: g.name, x, y, opacity, show: g.pct >= 5 };
  });

  return (
    <CardShell tone={tone} eyebrow="GENRE MIX" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY NETFLIX">
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
          당신이 가장 자주 머문 장르
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 0.95,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          {top?.name ?? 'Movies'}
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: conic,
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
          }}
        >
          {labelInfos.map((info, idx) =>
            info.show ? (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: info.x,
                  top: info.y,
                  transform: 'translate(-50%, -50%)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0A0A0F',
                  letterSpacing: '-0.01em',
                  textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                  whiteSpace: 'nowrap',
                  opacity: info.opacity,
                  pointerEvents: 'none',
                }}
              >
                {info.name}
              </div>
            ) : null
          )}

          <div
            style={{
              position: 'absolute',
              inset: 56,
              borderRadius: '50%',
              background: tone.bg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: tone.headline,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {animatedTopPct}%
            </div>
            <div
              style={{
                fontSize: 10,
                color: tone.muted,
                letterSpacing: '0.1em',
                marginTop: 4,
                maxWidth: 100,
                textAlign: 'center',
              }}
            >
              {top?.name?.toUpperCase() ?? ''}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '0 24px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px 16px',
        }}
      >
        {genres.map((g) => (
          <div
            key={g.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: tone.fg,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: g.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {g.name}
            </span>
            <span
              style={{
                color: tone.muted,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {g.pct}%
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
