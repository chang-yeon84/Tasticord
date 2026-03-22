import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchGenreStats, getRecentlyPlayedGames } from '@/lib/api/steam';

// 캐시 유효 시간: 6시간 (최근 플레이 기반이라 더 자주 갱신)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 장르 캐시 확인
    const { data: cache } = await supabase
      .from('taste_cache')
      .select('data, fetched_at')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .eq('data_type', 'genres')
      .maybeSingle();

    if (cache && Date.now() - new Date(cache.fetched_at).getTime() < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }

    // Steam 연동 확인
    const { data: connection } = await supabase
      .from('platform_connections')
      .select('platform_user_id')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .single();

    if (!connection?.platform_user_id) {
      return NextResponse.json({ error: 'Steam not connected' }, { status: 400 });
    }

    // 최근 2주간 플레이한 게임 가져오기
    const recentData = await getRecentlyPlayedGames(connection.platform_user_id);
    const recentGames = (recentData?.response?.games || []).map(
      (g: { appid: number; name: string; playtime_2weeks: number }) => ({
        appid: g.appid,
        name: g.name,
        playtime_minutes: g.playtime_2weeks,
      })
    );

    if (recentGames.length === 0) {
      return NextResponse.json({ genres: [] });
    }

    // Steam Store API로 장르 조회
    const genreStats = await fetchGenreStats(recentGames);

    // 캐시 저장
    const admin = createAdminClient();
    await admin.from('taste_cache').upsert({
      user_id: user.id,
      platform: 'steam',
      data_type: 'genres',
      data: { genres: genreStats },
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,data_type' });

    return NextResponse.json({ genres: genreStats });
  } catch (e) {
    console.error('Failed to fetch genres:', e);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
