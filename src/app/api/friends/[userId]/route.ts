// DELETE /api/friends/[userId]
// 친구 끊기 — 양방향 모두 삭제 (요청 취소 / 친구 해제 공통).
//   - 본인이 보낸 pending 취소
//   - 받은 pending 거절 (reject 라우트와 중복되지만 친구 페이지 UX 일관)
//   - 수락된 친구 끊기
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { userId: targetId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (targetId === user.id) {
      return NextResponse.json({ error: '자기 자신은 해제할 수 없어요' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 양방향 DELETE
    const { error } = await admin
      .from('friendships')
      .delete()
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${user.id})`,
      );

    if (error) {
      console.error('[friends/DELETE]', error);
      return NextResponse.json({ error: 'DB 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[friends/DELETE]', err);
    return NextResponse.json({ error: '해제 실패' }, { status: 500 });
  }
}
