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
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    window.location.href = '/auth/login';
  };

  return { currentUser, loading, signInWithKakao, signOut };
}
