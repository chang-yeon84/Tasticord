import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRecentlyPlayedGames, getPlayerAchievements, getSchemaForGame, getGlobalAchievementPercentages } from '@/lib/api/steam';

interface SchemaAchievement {
  name: string;
  displayName: string;
  description?: string;
  icon: string;
  icongray: string;
}

interface PlayerAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

// 캐시 유효 시간: 3시간
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

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
      .eq('data_type', 'achievements')
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

    const steamId = connection.platform_user_id;

    // 최근 플레이한 게임 가져오기
    const recentData = await getRecentlyPlayedGames(steamId);
    const recentGames = recentData?.response?.games || [];

    if (recentGames.length === 0) {
      return NextResponse.json({ achievements: [] });
    }

    // 각 게임의 도전과제를 병렬로 가져오기
    const results = await Promise.allSettled(
      recentGames.slice(0, 5).map(async (game: { appid: number; name: string }) => {
        const [playerData, schemaData, globalData] = await Promise.all([
          getPlayerAchievements(steamId, game.appid),
          getSchemaForGame(game.appid),
          getGlobalAchievementPercentages(game.appid).catch(() => null),
        ]);

        const playerAchievements: PlayerAchievement[] =
          playerData?.playerstats?.achievements || [];
        const schemaAchievements: SchemaAchievement[] =
          schemaData?.game?.availableGameStats?.achievements || [];

        // 스키마에서 아이콘/이름 매핑
        const schemaMap = new Map(
          schemaAchievements.map(a => [a.name, a])
        );

        // 전체 달성률 매핑
        const globalMap = new Map<string, number>();
        const globalList = globalData?.achievementpercentages?.achievements || [];
        for (const g of globalList as Array<{ name: string; percent: number }>) {
          globalMap.set(g.name, g.percent);
        }

        // 달성한 도전과제만 필터 → 최근 달성 순 정렬
        return playerAchievements
          .filter(a => a.achieved === 1 && a.unlocktime > 0)
          .sort((a, b) => b.unlocktime - a.unlocktime)
          .slice(0, 5)
          .map(a => {
            const schema = schemaMap.get(a.apiname);
            return {
              gameName: game.name,
              appid: game.appid,
              name: schema?.displayName || a.apiname,
              description: schema?.description || '',
              icon: schema?.icon || '',
              unlockedAt: a.unlocktime,
              globalPercent: globalMap.get(a.apiname) ?? null,
            };
          });
      })
    );

    // 성공한 결과만 합쳐서 최근 달성 순으로 정렬
    const achievements = results
      .filter((r): r is PromiseFulfilledResult<Array<{
        gameName: string;
        appid: number;
        name: string;
        description: string;
        icon: string;
        unlockedAt: number;
        globalPercent: number | null;
      }>> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => b.unlockedAt - a.unlockedAt);

    const responseData = { achievements };

    // 캐시 저장
    const admin = createAdminClient();
    await admin.from('taste_cache').upsert({
      user_id: user.id,
      platform: 'steam',
      data_type: 'achievements',
      data: responseData,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,data_type' });

    return NextResponse.json(responseData);
  } catch (e) {
    console.error('Failed to fetch achievements:', e);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
