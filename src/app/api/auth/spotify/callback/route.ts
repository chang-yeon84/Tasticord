import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/profile?error=spotify_denied`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${origin}/api/auth/spotify/callback`,
      }),
    });

    const tokenText = await tokenRes.text();
    let tokens;
    try {
      tokens = JSON.parse(tokenText);
    } catch {
      return NextResponse.redirect(`${origin}/profile?error=spotify_token_parse_${encodeURIComponent(tokenText.slice(0, 100))}`);
    }

    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/profile?error=spotify_no_token_${encodeURIComponent(JSON.stringify(tokens).slice(0, 100))}`);
    }

    // Get Spotify user profile
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const spotifyProfile = await profileRes.json();

    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    // Save to DB with admin client (bypasses RLS)
    const admin = createAdminClient();
    const { error: dbError } = await admin.from('platform_connections').upsert({
      user_id: user.id,
      platform: 'spotify',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      platform_user_id: spotifyProfile.id,
      platform_username: spotifyProfile.display_name,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      metadata: { country: spotifyProfile.country, product: spotifyProfile.product },
    }, { onConflict: 'user_id,platform' });

    if (dbError) {
      return NextResponse.redirect(`${origin}/profile?error=db_${encodeURIComponent(dbError.message)}`);
    }

    return NextResponse.redirect(`${origin}/profile?connected=spotify`);
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/profile?error=catch_${encodeURIComponent(e?.message || 'unknown')}`);
  }
}
