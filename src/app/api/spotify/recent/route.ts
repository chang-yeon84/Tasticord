import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getRecentlyPlayed } from '@/lib/api/spotify';

// 캐시 유효 시간: 30분
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function GET() {
  try {
    const token = await getValidSpotifyToken();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // 캐시 확인
    const { data: cache } = await admin
      .from('taste_cache')
      .select('data, fetched_at')
      .eq('user_id', token.userId)
      .eq('platform', 'spotify')
      .eq('data_type', 'recently_played')
      .maybeSingle();

    if (cache && Date.now() - new Date(cache.fetched_at).getTime() < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }

    // Spotify API 호출
    const data = await getRecentlyPlayed(token.accessToken, 20);
    const tracks = (data.items || []).map((item: {
      track: {
        id: string;
        name: string;
        artists: { name: string }[];
        album: { name: string; images: { url: string }[] };
        duration_ms: number;
        external_urls: { spotify: string };
      };
      played_at: string;
    }) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists.map((a: { name: string }) => a.name).join(', '),
      album: item.track.album.name,
      image: item.track.album.images?.[0]?.url || null,
      duration_ms: item.track.duration_ms,
      url: item.track.external_urls?.spotify,
      played_at: item.played_at,
    }));

    const cacheData = { tracks };

    await admin.from('taste_cache').upsert({
      user_id: token.userId,
      platform: 'spotify',
      data_type: 'recently_played',
      data: cacheData,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,data_type' });

    return NextResponse.json(cacheData);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
