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
        setCurrentUser(profile as Profile);
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
  };

  return { currentUser, loading, signInWithKakao, signOut };
}
