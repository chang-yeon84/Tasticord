import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidKakaoToken } from '@/lib/api/kakao-token';

interface KakaoFriend {
  id: number;
  uuid?: string;
  profile_nickname?: string;
  profile_thumbnail_image?: string;
}

interface KakaoFriendsResponse {
  elements?: KakaoFriend[];
  total_count?: number;
}

const KAKAO_FRIENDS_URL = 'https://kapi.kakao.com/v1/api/talk/friends';

// 카카오 친구목록 호출. 만료된 토큰은 refresh로 자동 갱신.
//   1) DB에 저장된 토큰을 getValidKakaoToken으로 가져옴 (만료 시 자동 refresh)
//   2) 1이 null이면 session.provider_token 폴백 (마이그/콜백 이전 가입자 호환)
//   3) 그래도 401이면 refresh 한 번 더 시도 후, 실패 시 재로그인 안내
async function fetchKakaoFriends(
  userId: string,
  fallbackToken: string | null,
): Promise<{ status: 'ok'; data: KakaoFriendsResponse } | { status: 'reauth' } | { status: 'error' }> {
  const tokenInfo = await getValidKakaoToken(userId);
  const primary = tokenInfo?.accessToken ?? fallbackToken;
  if (!primary) return { status: 'reauth' };

  let res = await fetch(KAKAO_FRIENDS_URL, {
    headers: { Authorization: `Bearer ${primary}` },
  });

  // 401이고 polished refresh를 안 썼다면(폴백 토큰 사용 케이스) — refresh 시도
  if (res.status === 401 && !tokenInfo) {
    const refreshed = await getValidKakaoToken(userId);
    if (refreshed) {
      res = await fetch(KAKAO_FRIENDS_URL, {
        headers: { Authorization: `Bearer ${refreshed.accessToken}` },
      });
    }
  }

  if (res.status === 401) return { status: 'reauth' };
  if (!res.ok) return { status: 'error' };
  return { status: 'ok', data: (await res.json()) as KakaoFriendsResponse };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const fallbackToken = session.provider_token ?? null;

    const result = await fetchKakaoFriends(user.id, fallbackToken);
    if (result.status === 'reauth') {
      return NextResponse.json({ error: '재로그인이 필요합니다' }, { status: 400 });
    }
    if (result.status === 'error') {
      return NextResponse.json(
        { error: '카카오 친구 목록을 가져올 수 없습니다' },
        { status: 500 },
      );
    }

    const friendsData = result.data;
    const admin = createAdminClient();

    let synced = 0;
    let newFriends = 0;

    for (const friend of friendsData.elements || []) {
      const { data: friendProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('kakao_id', friend.id)
        .single();

      if (!friendProfile) continue;

      const { data: existing } = await admin
        .from('friendships')
        .select('id')
        .eq('user_id', user.id)
        .eq('friend_id', friendProfile.id)
        .maybeSingle();

      const isNew = !existing;

      const { error: err1 } = await admin.from('friendships').upsert(
        {
          user_id: user.id,
          friend_id: friendProfile.id,
          kakao_friend_id: friend.id,
        },
        { onConflict: 'user_id,friend_id' },
      );

      const { error: err2 } = await admin.from('friendships').upsert(
        {
          user_id: friendProfile.id,
          friend_id: user.id,
          kakao_friend_id: null,
        },
        { onConflict: 'user_id,friend_id' },
      );

      if (!err1 && !err2) {
        synced += 1;
        if (isNew) newFriends += 1;
      }
    }

    return NextResponse.json({ synced, newFriends });
  } catch (e) {
    console.error('Kakao sync error:', e);
    return NextResponse.json(
      { error: '동기화 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
