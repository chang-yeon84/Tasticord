import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const claimedId = searchParams.get('openid.claimed_id');
  if (!claimedId) {
    return NextResponse.redirect(`${origin}/profile?error=steam_denied`);
  }

  // Extract Steam ID from claimed_id URL
  const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
  const steamId = steamIdMatch ? steamIdMatch[1] : claimedId.split('/').pop();

  if (!steamId) {
    return NextResponse.redirect(`${origin}/profile?error=steam_invalid`);
  }

  try {
    // Get Steam profile
    let username = null;
    if (process.env.STEAM_API_KEY) {
      const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`);
      const data = await res.json();
      username = data.response?.players?.[0]?.personaname || null;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    await supabase.from('platform_connections').upsert({
      user_id: user.id,
      platform: 'steam',
      access_token: null,
      refresh_token: null,
      platform_user_id: steamId,
      platform_username: username,
      metadata: {},
    }, { onConflict: 'user_id,platform' });

    return NextResponse.redirect(`${origin}/profile?connected=steam`);
  } catch (e) {
    console.error('Steam auth error:', e);
    return NextResponse.redirect(`${origin}/profile?error=steam_failed`);
  }
}
