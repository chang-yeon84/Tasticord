import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.YOUTUBE_CLIENT_ID!,
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    redirect_uri: `${origin}/api/auth/youtube/callback`,
    access_type: 'offline',
    prompt: 'consent',
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
