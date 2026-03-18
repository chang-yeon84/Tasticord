import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.session.user;
      const providerToken = data.session.provider_token;

      // Upsert profile
      await supabase.from('profiles').upsert({
        id: user.id,
        nickname: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.preferred_username || '사용자',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        kakao_id: user.user_metadata?.provider_id ? parseInt(user.user_metadata.provider_id) : null,
      }, { onConflict: 'id' });

      // Fetch and sync Kakao friends
      if (providerToken) {
        try {
          const friendsRes = await fetch('https://kapi.kakao.com/v1/api/talk/friends', {
            headers: { Authorization: `Bearer ${providerToken}` },
          });
          if (friendsRes.ok) {
            const friendsData = await friendsRes.json();
            // For each friend, check if they're registered and create friendship
            for (const friend of friendsData.elements || []) {
              // Find if this kakao user is registered
              const { data: friendProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('kakao_id', friend.id)
                .single();

              if (friendProfile) {
                // Create bidirectional friendship
                await supabase.from('friendships').upsert({
                  user_id: user.id,
                  friend_id: friendProfile.id,
                  kakao_friend_id: friend.id,
                }, { onConflict: 'user_id,friend_id' });

                await supabase.from('friendships').upsert({
                  user_id: friendProfile.id,
                  friend_id: user.id,
                  kakao_friend_id: null,
                }, { onConflict: 'user_id,friend_id' });
              }
            }
          }
        } catch (e) {
          console.error('Failed to sync Kakao friends:', e);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`);
}
