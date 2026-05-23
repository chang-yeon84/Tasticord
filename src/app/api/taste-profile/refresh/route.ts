// POST /api/taste-profile/refresh
// 본인의 음악/게임/영화 취향 스냅샷을 모아 taste_profiles에 upsert (친구 비교용).
// 24h 이내 갱신된 프로필이면 작업 스킵 (sync 훅이 앱 접속 시마다 호출하므로 가드 필수).
// body: { force?: boolean }
//
// 설계 메모: 장르는 Last.fm/Steam Store 호출이 무거우므로 sync 경로에서 직접 호출하지 않고
//   이미 생성된 wrapped_reports / wrapped_games_reports 가 있으면 거기서 재사용.
//   영화 장르는 netflix_history.metadata에 이미 들어 있어 그대로 집계.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getTopArtists } from '@/lib/api/spotify';
import { getOwnedGames } from '@/lib/api/steam';
import { toMovieGenreMix, type NetflixRow } from '@/lib/wrapped/movie-aggregate';

const REFRESH_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let force = false;
    try {
      const body = await req.json();
      force = body?.force === true;
    } catch {
      // 바디 없음 — force=false
    }

    const admin = createAdminClient();

    // 24h 가드
    if (!force) {
      const { data: existing } = await admin
        .from('taste_profiles')
        .select('updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing?.updated_at) {
        const age = Date.now() - new Date(existing.updated_at).getTime();
        if (age < REFRESH_TTL_MS) {
          return NextResponse.json({ status: 'fresh' });
        }
      }
    }

    // 연동 상태 + 기존 wrapped 데이터(장르 재사용) 병렬 조회
    const [{ data: connections }, { data: wrapped }, { data: wrappedGames }, { data: netflixRows }] =
      await Promise.all([
        supabase.from('platform_connections').select('platform').eq('user_id', user.id),
        admin.from('wrapped_reports').select('top_genres').eq('user_id', user.id).maybeSingle(),
        admin.from('wrapped_games_reports').select('genre_mix').eq('user_id', user.id).maybeSingle(),
        admin
          .from('netflix_history')
          .select('title, date_watched, poster_url, metadata')
          .eq('user_id', user.id)
          .order('date_watched', { ascending: false }),
      ]);

    const platforms = new Set((connections ?? []).map((c) => c.platform));

    // ── 음악 ──────────────────────────────────────────────
    let musicArtists: string[] = [];
    let musicGenres: string[] = [];
    if (platforms.has('spotify')) {
      try {
        const token = await getValidSpotifyToken();
        if (token) {
          const res = await getTopArtists(token.accessToken, 'medium_term', 20);
          musicArtists = (res?.items ?? [])
            .map((a: { name?: string }) => a.name)
            .filter(Boolean) as string[];
        }
      } catch (e) {
        console.error('[taste-profile/refresh] spotify 실패', e);
      }
    }
    const topGenres = (wrapped?.top_genres ?? []) as Array<{ name: string }>;
    musicGenres = topGenres.map((g) => g.name).filter(Boolean);

    // ── 게임 ──────────────────────────────────────────────
    let gameNames: string[] = [];
    let gameGenres: string[] = [];
    if (platforms.has('steam')) {
      try {
        const { data: steamConn } = await supabase
          .from('platform_connections')
          .select('platform_user_id')
          .eq('user_id', user.id)
          .eq('platform', 'steam')
          .maybeSingle();
        if (steamConn?.platform_user_id) {
          const owned = await getOwnedGames(steamConn.platform_user_id);
          const games: Array<{ name: string; playtime_forever: number }> =
            owned?.response?.games ?? [];
          gameNames = games
            .filter((g) => g.playtime_forever > 0)
            .sort((a, b) => b.playtime_forever - a.playtime_forever)
            .slice(0, 20)
            .map((g) => g.name)
            .filter(Boolean);
        }
      } catch (e) {
        console.error('[taste-profile/refresh] steam 실패', e);
      }
    }
    const genreMix = (wrappedGames?.genre_mix ?? []) as Array<{ name: string }>;
    gameGenres = genreMix.map((g) => g.name).filter(Boolean);

    // ── 영화 ──────────────────────────────────────────────
    const nfRows = (netflixRows ?? []) as NetflixRow[];
    const movieTitles = nfRows.slice(0, 30).map((r) => r.title).filter(Boolean);
    const movieGenres = toMovieGenreMix(nfRows, 8).map((g) => g.name);

    const payload = {
      user_id: user.id,
      music: { artists: musicArtists, genres: musicGenres },
      games: { games: gameNames, genres: gameGenres },
      movies: { titles: movieTitles, genres: movieGenres },
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin
      .from('taste_profiles')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('[taste-profile/refresh] upsert 실패', error);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ status: 'updated' });
  } catch (err) {
    console.error('[taste-profile/refresh]', err);
    return NextResponse.json({ error: '갱신 실패' }, { status: 500 });
  }
}
