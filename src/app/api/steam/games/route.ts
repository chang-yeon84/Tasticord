import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOwnedGames } from '@/lib/api/steam';

// 캐시 유효 시간: 24시간
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: connection } = await supabase
      .from('platform_connections')
      .select('platform_user_id')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .single();

    if (!connection?.platform_user_id) {
      return NextResponse.json({ error: 'Steam not connected' }, { status: 400 });
    }

    // 캐시 먼저 확인
    const { data: cache } = await supabase
      .from('taste_cache')
      .select('data, fetched_at')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .eq('data_type', 'owned_games')
      .maybeSingle();

    // 캐시가 있고 유효 시간 내면 캐시 반환
    if (cache && Date.now() - new Date(cache.fetched_at).getTime() < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }

    // 캐시 없거나 만료 → Steam API 호출 후 캐시 갱신
    const data = await getOwnedGames(connection.platform_user_id);
    const games = data?.response?.games || [];

    const cacheData = {
      game_count: data?.response?.game_count || 0,
      played_count: games.filter((g: { playtime_forever: number }) => g.playtime_forever > 0).length,
      total_playtime: games.reduce((sum: number, g: { playtime_forever: number }) => sum + g.playtime_forever, 0),
      games: games
        .sort((a: { playtime_forever: number }, b: { playtime_forever: number }) =>
          b.playtime_forever - a.playtime_forever
        )
        .slice(0, 50)
        .map((g: { appid: number; name: string; playtime_forever: number; img_icon_url: string }) => ({
          appid: g.appid,
          name: g.name,
          playtime_minutes: g.playtime_forever,
          icon: g.img_icon_url,
        })),
    };

    const admin = createAdminClient();
    await admin.from('taste_cache').upsert({
      user_id: user.id,
      platform: 'steam',
      data_type: 'owned_games',
      data: cacheData,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,data_type' });

    return NextResponse.json(cacheData);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
