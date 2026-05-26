// GET /api/friends/search?q=닉네임
// 닉네임으로 다른 가입자 검색. 본인 제외. 친구 관계 상태(none/pending_outgoing/pending_incoming/accepted) 동봉.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type SearchStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted';

export interface SearchResultItem {
  id: string;
  nickname: string;
  avatar_url: string | null;
  status: SearchStatus;
}

const MAX_RESULTS = 20;

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    if (q.length === 0) return NextResponse.json({ items: [] });
    if (q.length > 40) {
      return NextResponse.json({ error: '검색어가 너무 깁니다' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 닉네임 부분 일치(대소문자 무시). 본인 제외.
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, nickname, avatar_url')
      .ilike('nickname', `%${q}%`)
      .neq('id', user.id)
      .limit(MAX_RESULTS);

    if (error) {
      console.error('[friends/search]', error);
      return NextResponse.json({ error: '검색 실패' }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // 검색 결과 유저들과 본인의 friendships 관계 일괄 조회
    const targetIds = profiles.map((p) => p.id);
    const { data: rels } = await admin
      .from('friendships')
      .select('user_id, friend_id, status')
      .or(
        `and(user_id.eq.${user.id},friend_id.in.(${targetIds.join(',')})),and(friend_id.eq.${user.id},user_id.in.(${targetIds.join(',')}))`,
      );

    // 다른 사용자 id → status 매핑
    const statusByOther = new Map<string, SearchStatus>();
    for (const r of rels ?? []) {
      const other = r.user_id === user.id ? r.friend_id : r.user_id;
      if (r.status === 'accepted') {
        statusByOther.set(other, 'accepted');
      } else {
        // pending — 방향 구분
        statusByOther.set(other, r.user_id === user.id ? 'pending_outgoing' : 'pending_incoming');
      }
    }

    const items: SearchResultItem[] = profiles.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      avatar_url: p.avatar_url,
      status: statusByOther.get(p.id) ?? 'none',
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[friends/search]', err);
    return NextResponse.json({ error: '검색 실패' }, { status: 500 });
  }
}
