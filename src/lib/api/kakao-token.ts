// 카카오 access token 자동 갱신 헬퍼 (Spotify의 spotify-token.ts와 동일 패턴)
//
// Supabase는 OAuth provider_token(=카카오 access token, 약 6시간 만료)을
// 자동으로 갱신해주지 않음 → 만료되면 카카오 API 호출이 401.
// 우리가 직접 refresh_token으로 새 access를 받아 profiles에 갱신 저장.
//
// 필요한 환경변수:
//   KAKAO_REST_API_KEY        (Kakao Developers → 앱 설정 → 일반 → REST API 키)
//   KAKAO_CLIENT_SECRET       (선택 — "Client Secret 사용함"으로 설정한 경우만)
import { createAdminClient } from '@/lib/supabase/admin';

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';

interface KakaoRefreshResponse {
  access_token?: string;
  token_type?: string;
  refresh_token?: string;            // 잔여 수명 < 1개월일 때만 새 refresh도 같이 옴
  expires_in?: number;               // 초
  refresh_token_expires_in?: number; // 초
}

async function refreshKakaoAccessToken(refreshToken: string): Promise<KakaoRefreshResponse | null> {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!restApiKey) {
    console.error('[kakao-token] KAKAO_REST_API_KEY 미설정 — refresh 불가');
    return null;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: restApiKey,
    refresh_token: refreshToken,
  });
  if (process.env.KAKAO_CLIENT_SECRET) {
    body.set('client_secret', process.env.KAKAO_CLIENT_SECRET);
  }

  try {
    const res = await fetch(KAKAO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[kakao-token] refresh 실패', res.status, errText);
      return null;
    }
    return (await res.json()) as KakaoRefreshResponse;
  } catch (e) {
    console.error('[kakao-token] refresh 예외', e);
    return null;
  }
}

/**
 * 유저의 유효한 카카오 access token 반환.
 * 만료(1분 여유) 시 자동으로 refresh + DB 업데이트.
 * 반환: { accessToken } 또는 null (refresh_token 없음 / refresh 실패 — 이 때만 재로그인 필요)
 */
export async function getValidKakaoToken(
  userId: string,
): Promise<{ accessToken: string } | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('kakao_access_token, kakao_refresh_token, kakao_token_expires_at')
    .eq('id', userId)
    .single();

  if (!profile?.kakao_refresh_token) return null;

  // 아직 유효하면 그대로 반환 (1분 여유)
  if (profile.kakao_access_token && profile.kakao_token_expires_at) {
    const expiresAt = new Date(profile.kakao_token_expires_at).getTime();
    if (Date.now() < expiresAt - 60_000) {
      return { accessToken: profile.kakao_access_token };
    }
  }

  // 만료 — refresh
  const refreshed = await refreshKakaoAccessToken(profile.kakao_refresh_token);
  if (!refreshed?.access_token || !refreshed.expires_in) return null;

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  const update: Record<string, string> = {
    kakao_access_token: refreshed.access_token,
    kakao_token_expires_at: newExpiresAt,
  };
  // 카카오가 새 refresh도 같이 줬으면 함께 갱신 (rolling refresh)
  if (refreshed.refresh_token) {
    update.kakao_refresh_token = refreshed.refresh_token;
  }

  await admin.from('profiles').update(update).eq('id', userId);

  return { accessToken: refreshed.access_token };
}
