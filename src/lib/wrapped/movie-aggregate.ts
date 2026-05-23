// netflix_history 행 → Wrapped 영화 카드 데이터 변환 (순수 함수)
// 네트워크 호출 없음. CSV 업로드 시점에 TMDB enrichment가 끝나 있으므로 로컬 집계만.
import { GENRE_PALETTE } from './tones';
import type {
  WrappedMovieItem,
  WrappedMovieGenre,
  WrappedTopGenre,
  WrappedTotalWatched,
} from './movie-types';

// netflix_history 한 행 (필요한 컬럼만)
export interface NetflixRow {
  title: string;
  date_watched: string | null;
  poster_url: string | null;
  metadata: {
    genres?: string[];
    media_type?: 'movie' | 'tv' | null;
  } | null;
}

function mediaTypeOf(row: NetflixRow): 'movie' | 'tv' | null {
  return row.metadata?.media_type ?? null;
}

// 카드 1 — 최근 본 작품 (포스터 있는 것 우선, date_watched desc)
export function toRecentMovies(rows: NetflixRow[], limit = 12): WrappedMovieItem[] {
  return [...rows]
    .sort((a, b) => {
      // 포스터 있는 작품을 앞으로 (그리드가 빈 칸 없이 채워지도록)
      const aHas = a.poster_url ? 1 : 0;
      const bHas = b.poster_url ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      // 그 다음 최근 시청 순
      const aDate = a.date_watched ?? '';
      const bDate = b.date_watched ?? '';
      return bDate.localeCompare(aDate);
    })
    .slice(0, limit)
    .map((r) => ({
      title: r.title,
      poster_url: r.poster_url,
      date_watched: r.date_watched,
      media_type: mediaTypeOf(r),
    }));
}

// 장르별 작품 수 카운트 (한 작품에 장르 여러 개면 각각 +1)
function countGenres(rows: NetflixRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const genres = r.metadata?.genres ?? [];
    for (const g of genres) {
      const name = g.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return counts;
}

// 카드 2 — 장르 도넛 (game-aggregate toGenreMix와 동일 패턴: Top N 안에서의 비율로 100% 채움)
export function toMovieGenreMix(rows: NetflixRow[], topN = 5): WrappedMovieGenre[] {
  const counts = countGenres(rows);
  if (counts.size === 0) return [];

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
  const totalCount = sorted.reduce((s, [, c]) => s + c, 0);
  if (totalCount === 0) return [];

  const result: WrappedMovieGenre[] = sorted.map(([name, count], i) => ({
    name,
    pct: Math.round((count / totalCount) * 100),
    color: GENRE_PALETTE[i % GENRE_PALETTE.length],
  }));

  // 반올림 오차를 마지막 항목에 흡수 (conic-gradient 빈틈 방지)
  const sumPct = result.reduce((s, g) => s + g.pct, 0);
  if (sumPct !== 100) {
    result[result.length - 1].pct += 100 - sumPct;
  }

  return result;
}

// 카드 3 — 가장 많이 본 장르 1개 (전체 장르 태깅 대비 비중)
export function toTopGenre(rows: NetflixRow[]): WrappedTopGenre | null {
  const counts = countGenres(rows);
  if (counts.size === 0) return null;

  const totalTagged = [...counts.values()].reduce((s, c) => s + c, 0);
  const [name, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    name,
    count,
    pct: totalTagged > 0 ? Math.round((count / totalTagged) * 100) : 0,
  };
}

// 카드 4 — 총 시청량 (영화/시리즈 분리)
export function toTotalWatched(rows: NetflixRow[]): WrappedTotalWatched | null {
  if (rows.length === 0) return null;
  let movies = 0;
  let series = 0;
  for (const r of rows) {
    const t = mediaTypeOf(r);
    if (t === 'movie') movies += 1;
    else if (t === 'tv') series += 1;
  }
  return { total: rows.length, movies, series };
}
