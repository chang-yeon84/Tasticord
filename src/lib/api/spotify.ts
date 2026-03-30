const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  return res.json();
}

async function spotifyFetch(endpoint: string, accessToken: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

export async function getCurrentlyPlaying(accessToken: string) {
  return spotifyFetch('/me/player/currently-playing', accessToken);
}

export async function getTopTracks(accessToken: string, timeRange: string = 'medium_term', limit: number = 20) {
  return spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, accessToken);
}

export async function getTopArtists(accessToken: string, timeRange: string = 'medium_term', limit: number = 20) {
  return spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, accessToken);
}

export async function getRecentlyPlayed(accessToken: string, limit: number = 20) {
  return spotifyFetch(`/me/player/recently-played?limit=${limit}`, accessToken);
}

// 아티스트 여러 명의 정보 조회 (최대 50명)
export async function getArtists(accessToken: string, artistIds: string[]) {
  const ids = artistIds.slice(0, 50).join(',');
  return spotifyFetch(`/artists?ids=${ids}`, accessToken);
}

export async function searchTrack(accessToken: string, query: string) {
  return spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=10`, accessToken);
}

export async function createPlaylist(accessToken: string, userId: string, name: string, trackUris: string[]) {
  const createRes = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, public: false }),
  });
  const playlist = await createRes.json();

  if (trackUris.length > 0) {
    await fetch(`${SPOTIFY_API_BASE}/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: trackUris }),
    });
  }

  return playlist;
}

export { refreshAccessToken };
