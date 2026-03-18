import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/profile?error=youtube_denied`);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/auth/youtube/callback`,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/profile?error=youtube_token`);
    }

    // Get YouTube channel info
    const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    const admin = createAdminClient();
    await admin.from('platform_connections').upsert({
      user_id: user.id,
      platform: 'youtube_music',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      platform_user_id: channel?.id || null,
      platform_username: channel?.snippet?.title || null,
      token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
      metadata: {},
    }, { onConflict: 'user_id,platform' });

    return NextResponse.redirect(`${origin}/profile?connected=youtube_music`);
  } catch (e) {
    console.error('YouTube OAuth error:', e);
    return NextResponse.redirect(`${origin}/profile?error=youtube_failed`);
  }
}
