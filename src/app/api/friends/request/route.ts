// POST /api/friends/request
// 친구 요청 보내기. body: { targetUserId }
//   - 본인에게 X
//   - 이미 친구(accepted) 또는 내가 보낸 pending 요청 있으면 X
//   - 상대가 나에게 보낸 pending이 있으면 → "이미 받은 요청 있으니 수락하세요" 안내
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { targetUserId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }

    const targetId = body.targetUserId;
    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json({ error: 'targetUserId 필요' }, { status: 400 });
    }
    if (targetId === user.id) {
      return NextResponse.json({ error: '자기 자신에게는 요청할 수 없어요' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 대상 프로필 존재 확인
    const { data: target } = await admin
      .from('profiles')
      .select('id')
      .eq('id', targetId)
      .maybeSingle();
    if (!target) {
      return NextResponse.json({ error: '존재하지 않는 사용자' }, { status: 404 });
    }

    // 기존 관계 확인 (양방향 모두)
    const { data: rels } = await admin
      .from('friendships')
      .select('user_id, friend_id, status')
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${user.id})`,
      );

    for (const r of rels ?? []) {
      if (r.status === 'accepted') {
        return NextResponse.json({ error: '이미 친구입니다' }, { status: 409 });
      }
      if (r.user_id === user.id && r.status === 'pending') {
        return NextResponse.json({ error: '이미 요청을 보냈어요' }, { status: 409 });
      }
      if (r.friend_id === user.id && r.status === 'pending') {
        return NextResponse.json(
          { error: '상대가 먼저 보낸 요청이 있어요. 받은 요청에서 수락해주세요.' },
          { status: 409 },
        );
      }
    }

    const { error } = await admin
      .from('friendships')
      .insert({ user_id: user.id, friend_id: targetId, status: 'pending' });

    if (error) {
      // UNIQUE 위반은 그새 들어온 동시 요청 — OK로 응답
      if (error.code !== '23505') {
        console.error('[friends/request] insert', error);
        // 42703 = undefined column → 마이그레이션 미적용일 가능성 높음
        const hint =
          error.code === '42703'
            ? ' — friendships-pending 마이그레이션이 아직 적용 안 된 것 같아요. supabase-migration-friendships-pending.sql 실행 후 다시 시도.'
            : '';
        return NextResponse.json(
          { error: `DB 저장 실패 (${error.code ?? '?'}: ${error.message ?? ''})${hint}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ ok: true, status: 'pending_outgoing' });
  } catch (err) {
    console.error('[friends/request]', err);
    return NextResponse.json({ error: '요청 실패' }, { status: 500 });
  }
}
