import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { refreshAccessToken } from '@/lib/api/spotify';

/**
 * 현재 유저의 유효한 Spotify access_token을 반환.
 * 만료되었으면 자동으로 refresh 후 DB 업데이트.
 * 반환: { accessToken, userId } 또는 null (미연동/미인증)
 */
export async function getValidSpotifyToken() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: connection } = await supabase
    .from('platform_connections')
    .select('access_token, refresh_token, token_expires_at, platform_user_id')
    .eq('user_id', user.id)
    .eq('platform', 'spotify')
    .single();

  if (!connection?.access_token || !connection?.refresh_token) return null;

  // 토큰이 아직 유효하면 그대로 반환 (1분 여유)
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;

  if (Date.now() < expiresAt - 60_000) {
    return {
      accessToken: connection.access_token,
      userId: user.id,
      spotifyUserId: connection.platform_user_id,
    };
  }

  // 토큰 갱신
  const refreshed = await refreshAccessToken(connection.refresh_token);
  if (!refreshed.access_token) return null;

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const admin = createAdminClient();
  await admin.from('platform_connections').update({
    access_token: refreshed.access_token,
    token_expires_at: newExpiresAt,
  }).eq('user_id', user.id).eq('platform', 'spotify');

  return {
    accessToken: refreshed.access_token,
    userId: user.id,
    spotifyUserId: connection.platform_user_id,
  };
}
