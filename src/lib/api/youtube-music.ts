const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

async function youtubeFetch(endpoint: string, accessToken?: string) {
  const headers: Record<string, string> = {};
  let url = `${YOUTUBE_API_BASE}${endpoint}`;

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    url += `${endpoint.includes('?') ? '&' : '?'}key=${process.env.YOUTUBE_API_KEY}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  return res.json();
}

export async function getLikedVideos(accessToken: string) {
  const data = await youtubeFetch('/videos?part=snippet,contentDetails&myRating=like&maxResults=50&videoCategoryId=10', accessToken);
  return data;
}

export async function getPlaylists(accessToken: string) {
  return youtubeFetch('/playlists?part=snippet,contentDetails&mine=true&maxResults=50', accessToken);
}

export async function getPlaylistItems(accessToken: string, playlistId: string) {
  return youtubeFetch(`/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`, accessToken);
}
