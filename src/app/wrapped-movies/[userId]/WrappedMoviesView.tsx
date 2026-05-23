// 공유 페이지 클라이언트 뷰 — 영화 카드 6장
// 흐름: 커버 → 최근 → 장르 분석 → 총량 → 마무리
'use client';

import WrappedSlider from '@/components/wrapped/WrappedSlider';
import CoverCard from '@/components/wrapped/cards/CoverCard';
import ClosingCard from '@/components/wrapped/cards/ClosingCard';
import RecentMovies from '@/components/wrapped/cards/movies/RecentMovies';
import MovieGenreMix from '@/components/wrapped/cards/movies/MovieGenreMix';
import TopGenre from '@/components/wrapped/cards/movies/TopGenre';
import TotalWatched from '@/components/wrapped/cards/movies/TotalWatched';
import PlaceholderCard from '@/components/wrapped/cards/PlaceholderCard';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedMoviesReport } from '@/lib/wrapped/movie-types';
import type { ReactNode } from 'react';

interface Props {
  report: WrappedMoviesReport;
  tone: Tone;
}

export default function WrappedMoviesView({ report, tone }: Props) {
  const userName = report.nickname ?? '사용자';
  const userAvatarUrl = report.avatar_url;

  const card1: ReactNode =
    report.recent_movies.length > 0 ? (
      <RecentMovies key="1" tone={tone} movies={report.recent_movies} userName={userName} userAvatarUrl={userAvatarUrl} />
    ) : (
      <PlaceholderCard key="1" tone={tone} cardNumber={1} title="Recently Watched" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY NETFLIX" />
    );

  const card2: ReactNode =
    report.genre_mix.length > 0 ? (
      <MovieGenreMix key="2" tone={tone} genres={report.genre_mix} userName={userName} userAvatarUrl={userAvatarUrl} />
    ) : (
      <PlaceholderCard key="2" tone={tone} cardNumber={2} title="Genre Mix" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY NETFLIX" />
    );

  const card3: ReactNode = report.top_genre ? (
    <TopGenre key="3" tone={tone} data={report.top_genre} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="3" tone={tone} cardNumber={3} title="Top Genre" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY NETFLIX" />
  );

  const card4: ReactNode = report.total_watched ? (
    <TotalWatched key="4" tone={tone} data={report.total_watched} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="4" tone={tone} cardNumber={4} title="Total Watched" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY NETFLIX" />
  );

  const cover = (
    <CoverCard key="0" tone={tone} type="movie" userName={userName} userAvatarUrl={userAvatarUrl} />
  );
  const closing = (
    <ClosingCard key="closing" tone={tone} type="movie" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  const cards = [cover, card1, card2, card3, card4, closing];

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: tone.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px 40px',
        gap: 24,
      }}
    >
      <WrappedSlider tone={tone} cards={cards} />
    </div>
  );
}
