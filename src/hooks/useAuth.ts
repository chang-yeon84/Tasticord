'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { useAppStore } from '@/stores/useAppStore';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const { currentUser, setCurrentUser } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUser(profile as Profile);
        } else {
          // profiles 테이블에 없으면 카카오 메타데이터로 fallback
          const meta = user.user_metadata;
          setCurrentUser({
            id: user.id,
            kakao_id: null,
            nickname: meta?.full_name || meta?.name || meta?.preferred_username || '사용자',
            avatar_url: meta?.avatar_url || meta?.picture || null,
            created_at: user.created_at,
            updated_at: user.created_at,
          });
        }
      }
      setLoading(false);
    }
    getUser();
  }, [supabase, setCurrentUser]);

  const signInWithKakao = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'friends',
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);

    // 카카오 로그인 세션도 함께 끊기 (자동 로그인 방지)
    const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    if (kakaoClientId) {
      const logoutRedirect = encodeURIComponent(`${window.location.origin}/auth/login`);
      window.location.href = `https://kauth.kakao.com/oauth/logout?client_id=${kakaoClientId}&logout_redirect_uri=${logoutRedirect}`;
    } else {
      window.location.href = '/auth/login';
    }
  };

  return { currentUser, loading, signInWithKakao, signOut };
}
