import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/profile?error=yt_denied`);
  }

  // Step 1: Exchange code for tokens
  let tokens;
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
    const text = await tokenRes.text();
    tokens = JSON.parse(text);
    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/profile?error=yt_no_token_${encodeURIComponent(text.slice(0, 100))}`);
    }
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/profile?error=yt_step1_${encodeURIComponent(e?.message?.slice(0, 80) || '')}`);
  }

  // Step 2: Get YouTube channel info
  let channel = null;
  try {
    const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });
    const data = await channelRes.json();
    channel = data.items?.[0] || null;
  } catch {
    // Channel info is optional, continue
  }

  // Step 3: Get current user
  let userId;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/profile?error=yt_step3_${encodeURIComponent(e?.message?.slice(0, 80) || '')}`);
  }

  if (!userId) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  // Step 4: Save to DB
  try {
    const admin = createAdminClient();
    const { error: dbError } = await admin.from('platform_connections').upsert({
      user_id: userId,
      platform: 'youtube_music',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      platform_user_id: channel?.id || null,
      platform_username: channel?.snippet?.title || null,
      token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
      metadata: {},
    }, { onConflict: 'user_id,platform' });

    if (dbError) {
      return NextResponse.redirect(`${origin}/profile?error=yt_db_${encodeURIComponent(dbError.message.slice(0, 100))}`);
    }
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/profile?error=yt_step4_${encodeURIComponent(e?.message?.slice(0, 80) || '')}`);
  }

  return NextResponse.redirect(`${origin}/profile?connected=youtube_music`);
}
