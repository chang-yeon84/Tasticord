import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getCurrentlyPlaying } from '@/lib/api/spotify';

export async function GET() {
  try {
    const token = await getValidSpotifyToken();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await getCurrentlyPlaying(token.accessToken);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
