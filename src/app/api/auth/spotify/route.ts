import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: 'user-read-currently-playing user-top-read user-read-recently-played playlist-modify-public playlist-modify-private',
    redirect_uri: `${origin}/api/auth/spotify/callback`,
    show_dialog: 'true',
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
