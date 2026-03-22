import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const origin = `${protocol}://${host}`;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/profile?error=spotify_denied`);
  }

  // Step 1: Exchange code for tokens
  let tokens;
  try {
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
    const text = await tokenRes.text();
    tokens = JSON.parse(text);
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/profile?error=step1_${encodeURIComponent(e?.message?.slice(0, 80) || '')}`);
  }

  if (!tokens.access_token) {
    return NextResponse.redirect(`${origin}/profile?error=no_token`);
  }

  // Step 2: Get Spotify profile
  let spotifyProfile;
  try {
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });
    const text = await profileRes.text();
    if (!profileRes.ok) {
      return NextResponse.redirect(`${origin}/profile?error=step2_status${profileRes.status}_${encodeURIComponent(text.slice(0, 100))}`);
    }
    spotifyProfile = JSON.parse(text);
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/profile?error=step2_${encodeURIComponent(e?.message?.slice(0, 80) || '')}`);
  }

  // Step 3: Get current user from Supabase
  let userId;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/profile?error=step3_${encodeURIComponent(e?.message?.slice(0, 80) || '')}`);
  }

  if (!userId) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  // Step 4: Save to DB
  try {
    const admin = createAdminClient();
    const { error: dbError } = await admin.from('platform_connections').upsert({
      user_id: userId,
      platform: 'spotify',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      platform_user_id: spotifyProfile.id,
      platform_username: spotifyProfile.display_name,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      metadata: { country: spotifyProfile.country, product: spotifyProfile.product },
    }, { onConflict: 'user_id,platform' });

    if (dbError) {
      return NextResponse.redirect(`${origin}/profile?error=step4_${encodeURIComponent(dbError.message.slice(0, 80))}`);
    }
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/profile?error=step4catch_${encodeURIComponent(e?.message?.slice(0, 80) || '')}`);
  }

  return NextResponse.redirect(`${origin}/profile?connected=spotify`);
}
