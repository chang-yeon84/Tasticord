import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 친구 동기화는 메인 흐름을 막지 않도록 백그라운드에서 실행
// 단일 사용자 콜백 핸들러 안에서 N+1 쿼리를 돌리던 기존 로직을 단일 쿼리로 단축
async function syncKakaoFriends(userId: string, providerToken: string) {
  try {
    const admin = createAdminClient();

    const friendsRes = await fetch('https://kapi.kakao.com/v1/api/talk/friends', {
      headers: { Authorization: `Bearer ${providerToken}` },
      // 카카오 API 5초 타임아웃
      signal: AbortSignal.timeout(5000),
    });

    if (!friendsRes.ok) return;
    const friendsData = await friendsRes.json();
    const elements = (friendsData.elements || []) as Array<{ id: number }>;
    if (elements.length === 0) return;

    const kakaoIds = elements.map((f) => f.id);

    // 한 번에 모든 가입 친구 조회 (N+1 → 1 쿼리)
    const { data: registeredProfiles } = await admin
      .from('profiles')
      .select('id, kakao_id')
      .in('kakao_id', kakaoIds);

    if (!registeredProfiles || registeredProfiles.length === 0) return;

    // 양방향 friendships upsert를 배치로
    const myEdges = registeredProfiles.map((p) => ({
      user_id: userId,
      friend_id: p.id,
      kakao_friend_id: p.kakao_id,
    }));
    const reverseEdges = registeredProfiles.map((p) => ({
      user_id: p.id,
      friend_id: userId,
      kakao_friend_id: null,
    }));

    await admin.from('friendships').upsert(myEdges, { onConflict: 'user_id,friend_id' });
    await admin.from('friendships').upsert(reverseEdges, { onConflict: 'user_id,friend_id' });
  } catch (e) {
    console.error('[auth/callback] friend sync failed:', e);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
  }

  const user = data.session.user;
  const providerToken = data.session.provider_token;

  // 프로필 upsert는 즉시 (반드시 동기 처리)
  const admin = createAdminClient();

  // 기본 필드. nickname/avatar는 사용자가 직접 편집한 값을 덮어쓰지 않도록 주의:
  //   - 신규 행이면 카카오 metadata 사용
  //   - 기존 행이면 기존 nickname/avatar 유지(편집된 값 보존) — onConflict 시 EXCLUDED 사용 안 함
  const fromKakaoNickname =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username ||
    '사용자';
  const fromKakaoAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const kakaoIdNum = user.user_metadata?.provider_id ? parseInt(user.user_metadata.provider_id) : null;

  // 기존 프로필이 있으면 nickname/avatar는 그대로 두고, 카카오 토큰만 갱신
  const { data: existing } = await admin
    .from('profiles')
    .select('id, nickname, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const profileRow: Record<string, unknown> = {
    id: user.id,
    kakao_id: kakaoIdNum,
    nickname: existing?.nickname ?? fromKakaoNickname,
    avatar_url: existing?.avatar_url ?? fromKakaoAvatar,
  };

  // 카카오 토큰 저장 (자동 갱신용) — 둘 다 있을 때만
  const providerRefreshToken = data.session.provider_refresh_token;
  if (providerToken && providerRefreshToken) {
    profileRow.kakao_access_token = providerToken;
    profileRow.kakao_refresh_token = providerRefreshToken;
    // Kakao access token 기본 6시간 — provider_token_expires_at 노출 안 되므로 보수적으로 6h 사용
    profileRow.kakao_token_expires_at = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  }

  await admin.from('profiles').upsert(profileRow, { onConflict: 'id' });

  // 친구 동기화는 백그라운드 (await 안 함) — 리다이렉트가 친구 수에 영향받지 않음
  // 첫 동기화는 좀 늦더라도 친구 페이지의 수동 동기화 버튼으로 보완 가능
  if (providerToken) {
    void syncKakaoFriends(user.id, providerToken);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
