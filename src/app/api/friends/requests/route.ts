// GET /api/friends/requests
// 본인이 받은 pending 친구 요청 목록 (sender 프로필 포함, 최신순).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface IncomingRequestRow {
  id: string;
  user_id: string; // sender
  created_at: string;
  profiles: { id: string; nickname: string; avatar_url: string | null } | null;
}

export interface IncomingRequest {
  id: string;
  from_user_id: string;
  created_at: string;
  profile: { id: string; nickname: string; avatar_url: string | null } | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // RLS: friend_id=me AND status='pending' 행이 보이도록 마이그에서 정책 확장됨
    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id, created_at, profiles:user_id (id, nickname, avatar_url)')
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[friends/requests]', error);
      return NextResponse.json({ items: [] });
    }

    const items: IncomingRequest[] = (data as unknown as IncomingRequestRow[]).map((r) => ({
      id: r.id,
      from_user_id: r.user_id,
      created_at: r.created_at,
      profile: r.profiles
        ? { id: r.profiles.id, nickname: r.profiles.nickname, avatar_url: r.profiles.avatar_url }
        : null,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[friends/requests]', err);
    return NextResponse.json({ items: [] });
  }
}
