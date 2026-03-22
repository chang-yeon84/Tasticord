import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOwnedGames, getRecentlyPlayedGames } from '@/lib/api/steam';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const origin = `${protocol}://${host}`;

  const claimedId = searchParams.get('openid.claimed_id');
  if (!claimedId) {
    return NextResponse.redirect(`${origin}/profile?error=steam_denied`);
  }

  // Steam ID 추출 (claimed_id URL에서 숫자 부분)
  const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
  const steamId = steamIdMatch ? steamIdMatch[1] : claimedId.split('/').pop();

  if (!steamId) {
    return NextResponse.redirect(`${origin}/profile?error=steam_invalid`);
  }

  try {
    // Steam 프로필 조회
    let username = null;
    if (process.env.STEAM_API_KEY) {
      const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`);
      const data = await res.json();
      username = data.response?.players?.[0]?.personaname || null;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    const admin = createAdminClient();

    // platform_connections에 연동 정보 저장
    await admin.from('platform_connections').upsert({
      user_id: user.id,
      platform: 'steam',
      access_token: null,
      refresh_token: null,
      platform_user_id: steamId,
      platform_username: username,
      metadata: {},
    }, { onConflict: 'user_id,platform' });

    // Steam 데이터를 taste_cache에 캐싱 (비동기로 처리, 실패해도 연동은 성공)
    try {
      // 보유 게임 목록 + 플레이타임
      const ownedData = await getOwnedGames(steamId);
      const games = ownedData?.response?.games || [];
      await admin.from('taste_cache').upsert({
        user_id: user.id,
        platform: 'steam',
        data_type: 'owned_games',
        data: {
          game_count: ownedData?.response?.game_count || 0,
          played_count: games.filter((g: { playtime_forever: number }) => g.playtime_forever > 0).length,
          total_playtime: games.reduce((sum: number, g: { playtime_forever: number }) => sum + g.playtime_forever, 0),
          // 플레이타임 순으로 정렬해서 상위 50개만 저장 (용량 절약)
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
        },
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform,data_type' });

      // 최근 2주 플레이 게임
      const recentData = await getRecentlyPlayedGames(steamId);
      await admin.from('taste_cache').upsert({
        user_id: user.id,
        platform: 'steam',
        data_type: 'recently_played',
        data: {
          games: (recentData?.response?.games || []).map((g: { appid: number; name: string; playtime_2weeks: number; playtime_forever: number }) => ({
            appid: g.appid,
            name: g.name,
            playtime_2weeks: g.playtime_2weeks,
            playtime_total: g.playtime_forever,
          })),
        },
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform,data_type' });
    } catch (cacheError) {
      // 캐싱 실패해도 연동 자체는 성공 처리
      console.error('Steam cache error:', cacheError);
    }

    return NextResponse.redirect(`${origin}/profile?connected=steam`);
  } catch (e) {
    console.error('Steam auth error:', e);
    return NextResponse.redirect(`${origin}/profile?error=steam_failed`);
  }
}
