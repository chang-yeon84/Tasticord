const TMDB_API_BASE = 'https://api.themoviedb.org/3';

async function tmdbFetch(endpoint: string) {
  const res = await fetch(`${TMDB_API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${process.env.TMDB_API_KEY}&language=ko-KR`);
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  return res.json();
}

export async function searchMovie(query: string) {
  return tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}`);
}

export async function searchTv(query: string) {
  return tmdbFetch(`/search/tv?query=${encodeURIComponent(query)}`);
}

export async function getMovieDetails(id: number) {
  return tmdbFetch(`/movie/${id}`);
}

export async function getTvDetails(id: number) {
  return tmdbFetch(`/tv/${id}`);
}
