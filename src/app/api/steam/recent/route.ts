import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRecentlyPlayedGames } from '@/lib/api/steam';

// 캐시 유효 시간: 1시간
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 캐시 확인
    const { data: cache } = await supabase
      .from('taste_cache')
      .select('data, fetched_at')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .eq('data_type', 'recent_games')
      .maybeSingle();

    if (cache && Date.now() - new Date(cache.fetched_at).getTime() < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }

    const { data: connection } = await supabase
      .from('platform_connections')
      .select('platform_user_id')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .single();

    if (!connection?.platform_user_id) {
      return NextResponse.json({ error: 'Steam not connected' }, { status: 400 });
    }

    const data = await getRecentlyPlayedGames(connection.platform_user_id);

    // 캐시 저장
    const admin = createAdminClient();
    await admin.from('taste_cache').upsert({
      user_id: user.id,
      platform: 'steam',
      data_type: 'recent_games',
      data,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,data_type' });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
