// Apple Music API requires Developer Token (JWT) and MusicKit JS for user auth
// Server-side: use Developer Token for catalog searches
// Client-side: use MusicKit JS for user library access

const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';

export async function getDeveloperToken(): Promise<string> {
  // In production, generate JWT using APPLE_MUSIC_KEY_ID, TEAM_ID, PRIVATE_KEY
  // For now, return placeholder
  return process.env.APPLE_MUSIC_PRIVATE_KEY || '';
}

async function appleMusicFetch(endpoint: string, userToken?: string) {
  const developerToken = await getDeveloperToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${developerToken}`,
  };
  if (userToken) {
    headers['Music-User-Token'] = userToken;
  }

  const res = await fetch(`${APPLE_MUSIC_API_BASE}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`Apple Music API error: ${res.status}`);
  return res.json();
}

export async function getUserLibrarySongs(userToken: string) {
  return appleMusicFetch('/me/library/songs?limit=100', userToken);
}

export async function getUserPlaylists(userToken: string) {
  return appleMusicFetch('/me/library/playlists?limit=100', userToken);
}

export async function searchCatalog(term: string, storefront: string = 'kr') {
  return appleMusicFetch(`/catalog/${storefront}/search?term=${encodeURIComponent(term)}&types=songs&limit=10`);
}
