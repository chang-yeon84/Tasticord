// POST /api/friends/reject
// 받은 친구 요청 거절. body: { fromUserId }. 해당 pending 행 DELETE.
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
    const { error } = await admin
      .from('friendships')
      .delete()
      .eq('user_id', fromId)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('[friends/reject]', error);
      return NextResponse.json({ error: 'DB 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[friends/reject]', err);
    return NextResponse.json({ error: '거절 실패' }, { status: 500 });
  }
}
