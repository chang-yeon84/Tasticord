// POST /api/friends/accept
// 받은 친구 요청 수락. body: { fromUserId }
// (fromUserId, me, 'pending') → 'accepted' UPDATE + (me, fromUserId, 'accepted') INSERT 양방향.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { fromUserId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }

    const fromId = body.fromUserId;
    if (!fromId || typeof fromId !== 'string') {
      return NextResponse.json({ error: 'fromUserId 필요' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 받은 pending이 실제로 있는지 확인
    const { data: pending, error: fetchErr } = await admin
      .from('friendships')
      .select('id, status')
      .eq('user_id', fromId)
      .eq('friend_id', user.id)
      .maybeSingle();
    if (fetchErr) {
      console.error('[friends/accept] fetch', fetchErr);
      return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
    }
    if (!pending || pending.status !== 'pending') {
      return NextResponse.json({ error: '대기 중인 요청이 없어요' }, { status: 404 });
    }

    // sender → receiver 행 'accepted'로
    const { error: updErr } = await admin
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', pending.id);
    if (updErr) {
      console.error('[friends/accept] update', updErr);
      return NextResponse.json({ error: 'DB 업데이트 실패' }, { status: 500 });
    }

    // 반대 방향 INSERT (이미 있을 수 있으니 upsert)
    const { error: insErr } = await admin
      .from('friendships')
      .upsert(
        { user_id: user.id, friend_id: fromId, status: 'accepted', kakao_friend_id: null },
        { onConflict: 'user_id,friend_id' },
      );
    if (insErr) {
      console.error('[friends/accept] upsert reverse', insErr);
      return NextResponse.json({ error: 'DB 양방향 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[friends/accept]', err);
    return NextResponse.json({ error: '수락 실패' }, { status: 500 });
  }
}
