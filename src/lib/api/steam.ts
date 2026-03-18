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
