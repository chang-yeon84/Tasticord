import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getTopTracks } from '@/lib/api/spotify';
import { getTracksGenreDistribution } from '@/lib/api/lastfm';

// 캐시 유효 시간: 24시간 (장르는 자주 안 바뀌므로)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const token = await getValidSpotifyToken();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const cacheKey = 'spotify_genres';

    // 캐시 확인
    const { data: cache } = await admin
      .from('taste_cache')
      .select('data, fetched_at')
      .eq('user_id', token.userId)
      .eq('platform', 'spotify')
      .eq('data_type', cacheKey)
      .maybeSingle();

    if (cache && Date.now() - new Date(cache.fetched_at).getTime() < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }

    // short_term Top Tracks 캐시 확인 → 없으면 API 호출
    const { data: tracksCache } = await admin
      .from('taste_cache')
      .select('data')
      .eq('user_id', token.userId)
      .eq('platform', 'spotify')
      .eq('data_type', 'top_tracks_short_term')
      .maybeSingle();

    let tracks: { name: string; artist: string }[];

    if (tracksCache?.data?.tracks) {
      tracks = tracksCache.data.tracks;
    } else {
      // 캐시 없으면 Spotify API로 short_term 가져오기
      const data = await getTopTracks(token.accessToken, 'short_term', 50);
      tracks = (data.items || []).map((t: { name: string; artists: { name: string }[] }) => ({
        name: t.name,
        artist: t.artists.map((a: { name: string }) => a.name).join(', '),
      }));
    }

    if (tracks.length === 0) {
      return NextResponse.json({ genres: [], totalTracks: 0 });
    }

    // Last.fm에서 장르 분포 조회
    const result = await getTracksGenreDistribution(tracks);

    // 캐시 저장
    await admin.from('taste_cache').upsert({
      user_id: token.userId,
      platform: 'spotify',
      data_type: cacheKey,
      data: result,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,data_type' });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
