import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSpotifyRedirectUri } from '@/lib/utils/spotify-redirect';

export async function GET() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const origin = `${protocol}://${host}`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: 'user-read-currently-playing user-top-read user-read-recently-played playlist-modify-public playlist-modify-private',
    redirect_uri: getSpotifyRedirectUri(origin),
    show_dialog: 'true',
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
