export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  playtime_2weeks?: number;
  img_icon_url: string;
  has_community_visible_stats?: boolean;
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
  gameextrainfo?: string; // currently playing game name
  gameid?: string;
}

export interface SteamOwnedGamesResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

export interface SteamRecentGamesResponse {
  response: {
    total_count: number;
    games: SteamGame[];
  };
}
