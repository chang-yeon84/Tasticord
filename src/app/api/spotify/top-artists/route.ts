import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getTopArtists } from '@/lib/api/spotify';

// 캐시 유효 시간: 6시간
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || 'medium_term';

    const token = await getValidSpotifyToken();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cacheKey = `top_artists_${timeRange}`;
    const admin = createAdminClient();

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

    // Spotify API 호출
    const data = await getTopArtists(token.accessToken, timeRange, 20);
    const artists = (data.items || []).map((a: { id: string; name: string; images: { url: string }[]; genres: string[]; external_urls: { spotify: string } }) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || null,
      genres: a.genres || [],
      url: a.external_urls?.spotify,
    }));

    const cacheData = { artists };

    await admin.from('taste_cache').upsert({
      user_id: token.userId,
      platform: 'spotify',
      data_type: cacheKey,
      data: cacheData,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,data_type' });

    return NextResponse.json(cacheData);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
