const STEAM_API_BASE = 'https://api.steampowered.com';

async function steamFetch(endpoint: string) {
  const res = await fetch(`${STEAM_API_BASE}${endpoint}&key=${process.env.STEAM_API_KEY}`);
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  return res.json();
}

export async function getOwnedGames(steamId: string) {
  return steamFetch(`/IPlayerService/GetOwnedGames/v0001/?steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`);
}

export async function getRecentlyPlayedGames(steamId: string) {
  return steamFetch(`/IPlayerService/GetRecentlyPlayedGames/v0001/?steamid=${steamId}&format=json&count=10`);
}

export async function getPlayerSummaries(steamId: string) {
  return steamFetch(`/ISteamUser/GetPlayerSummaries/v0002/?steamids=${steamId}`);
}

export async function getPlayerAchievements(steamId: string, appId: number) {
  return steamFetch(`/ISteamUserStats/GetPlayerAchievements/v0001/?steamid=${steamId}&appid=${appId}`);
}

// 게임별 전체 유저 도전과제 달성률 조회 (희귀도 계산용)
// 각 도전과제의 전체 플레이어 중 달성 비율(%)을 반환
export async function getGlobalAchievementPercentages(appId: number) {
  return steamFetch(`/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${appId}`);
}

// 게임 스키마 조회 (도전과제 이름, 아이콘 등)
export async function getSchemaForGame(appId: number) {
  return steamFetch(`/ISteamUserStats/GetSchemaForGame/v2/?appid=${appId}`);
}

// Steam Store API로 게임 상세 정보(장르 등) 조회 (비공식 API)
export async function getAppDetails(appId: number) {
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=korean`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[String(appId)]?.success ? data[String(appId)].data : null;
}

// 여러 게임의 장르를 가져와서 장르별 플레이타임 집계
// games: [{ appid, playtime_minutes }] 형태
export async function fetchGenreStats(games: Array<{ appid: number; name: string; playtime_minutes: number }>) {
  const genreMap: Record<string, { playtime: number; count: number }> = {};

  // 플레이타임 상위 15개만 조회 (API 부담 줄이기)
  const topGames = games
    .filter(g => g.playtime_minutes > 0)
    .slice(0, 15);

  // 5개씩 병렬 호출 (Steam Store API 레이트 리밋 방지)
  for (let i = 0; i < topGames.length; i += 5) {
    const batch = topGames.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(game => getAppDetails(game.appid))
    );

    results.forEach((result, idx) => {
      if (result.status !== 'fulfilled' || !result.value?.genres) return;
      const game = batch[idx];

      for (const genre of result.value.genres) {
        const name = genre.description as string;
        if (!genreMap[name]) {
          genreMap[name] = { playtime: 0, count: 0 };
        }
        genreMap[name].playtime += game.playtime_minutes;
        genreMap[name].count += 1;
      }
    });
  }

  // 플레이타임 순으로 정렬
  return Object.entries(genreMap)
    .map(([name, data]) => ({ name, playtime: data.playtime, count: data.count }))
    .sort((a, b) => b.playtime - a.playtime);
}

// 현재 플레이 중인 게임 조회
// GetPlayerSummaries 응답에서 gameextrainfo(게임명), gameid(앱ID) 추출
export async function getCurrentlyPlaying(steamId: string) {
  const data = await getPlayerSummaries(steamId);
  const player = data?.response?.players?.[0];

  if (!player) return null;

  // personastate: 0=오프라인, 1=온라인, 2=바쁨, 3=자리비움, 4=수면, 5=거래 희망, 6=플레이 희망
  // gameextrainfo: 현재 플레이 중인 게임 이름 (플레이 중이 아니면 없음)
  // gameid: 현재 플레이 중인 게임의 appId (플레이 중이 아니면 없음)
  // communityvisibilitystate: 1=비공개, 3=공개
  return {
    isPlaying: !!player.gameextrainfo,
    gameName: player.gameextrainfo || null,
    gameId: player.gameid || null,
    personaState: player.personastate,
    profileName: player.personaname,
    avatarUrl: player.avatarfull,
    isProfilePublic: player.communityvisibilitystate === 3,
  };
}
