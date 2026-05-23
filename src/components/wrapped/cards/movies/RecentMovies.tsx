// 영화 카드 1 — 최근 본 작품 포스터 그리드 (GRID 템플릿)
// 포스터가 위→아래 순서로 페이드인 (60ms 간격)
'use client';

import CardShell from '../../CardShell';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedMovieItem } from '@/lib/wrapped/movie-types';

interface Props {
  tone: Tone;
  movies: WrappedMovieItem[];
  userName?: string;
  userAvatarUrl?: string | null;
}

export default function RecentMovies({ tone, movies, userName, userAvatarUrl }: Props) {
  // 3열 그리드 — 최대 9개 (3행)만 노출해 카드 높이에 맞춤
  const grid = movies.slice(0, 9);

  return (
    <CardShell
      tone={tone}
      eyebrow="RECENTLY WATCHED"
      userName={userName}
      userAvatarUrl={userAvatarUrl}
      footerRight="POWERED BY NETFLIX"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes rm-poster-in {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />
      <div style={{ padding: '28px 24px 18px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: tone.muted,
            letterSpacing: '0.16em',
            marginBottom: 12,
          }}
        >
          요즘 당신이 빠져 있던
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 0.95,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          최근 본 작품
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          alignContent: 'center',
        }}
      >
        {grid.map((m, i) => (
          <div
            key={`${m.title}-${i}`}
            style={{
              aspectRatio: '2 / 3',
              borderRadius: 10,
              overflow: 'hidden',
              position: 'relative',
              background: `linear-gradient(135deg, ${tone.chip}, ${tone.bg})`,
              border: `1px solid ${tone.chipBorder}`,
              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              animation: `rm-poster-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 60}ms both`,
            }}
          >
            {m.poster_url ? (
              <img
                src={m.poster_url}
                alt={m.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: tone.fg,
                  textAlign: 'center',
                  lineHeight: 1.25,
                }}
              >
                {m.title}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 24px 4px' }}>
        <div style={{ fontSize: 12, color: tone.muted, lineHeight: 1.5 }}>
          이 작품들이 최근 당신의 밤을 채웠어요.
        </div>
      </div>
    </CardShell>
  );
}
