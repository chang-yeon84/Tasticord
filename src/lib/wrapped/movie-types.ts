// Wrapped 영화 카드 데이터 타입
// DB(wrapped_movies_reports) JSONB 컬럼과 1:1 대응
//
// 데이터 소스: netflix_history (CSV 업로드 시 TMDB enrichment 완료)
//   netflix_history.metadata = { genres: string[], media_type: 'movie'|'tv'|null }
//
// 흐름: 최근(Front) → 분석(Back)
//  1. RecentMovie    — 최근 본 작품 포스터 그리드
//  2. MovieGenre     — 장르 도넛
//  3. TopGenre       — 가장 많이 본 장르 스포트라이트
//  4. TotalWatched   — 총 본 작품 수 + 영화/시리즈 비율

export interface WrappedMovieItem {
  title: string;
  poster_url: string | null;
  date_watched: string | null;
  media_type: 'movie' | 'tv' | null;
}

// 카드 2 — 장르 도넛 (음악/게임 GenreMix와 동일 형태)
export interface WrappedMovieGenre {
  name: string;
  pct: number;
  color: string;
}

// 카드 3 — 가장 많이 본 장르 1개
export interface WrappedTopGenre {
  name: string;
  count: number; // 이 장르 작품 수
  pct: number; // 전체 장르 태깅 중 비중 (0~100)
}

// 카드 4 — 총 시청량
export interface WrappedTotalWatched {
  total: number; // 전체 작품 수 (dedupe된 작품 기준)
  movies: number; // media_type === 'movie'
  series: number; // media_type === 'tv'
}

export interface WrappedMoviesReport {
  user_id: string;
  tone: 'A' | 'B' | 'C';
  recent_movies: WrappedMovieItem[];
  genre_mix: WrappedMovieGenre[];
  top_genre: WrappedTopGenre | null;
  total_watched: WrappedTotalWatched | null;
  nickname: string | null;
  avatar_url: string | null;
  generated_at: string;
}
