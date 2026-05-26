// PATCH /api/profile/update
// 본인 프로필(닉네임/아바타) 직접 편집.
// 카카오 OAuth가 nickname/avatar를 안 줘서 '사용자'/null로 저장된 경우 등을 사용자가 직접 고치게.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_NICKNAME = 20;

interface UpdateBody {
  nickname?: string;
  avatar_url?: string | null;
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: UpdateBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }

    const updates: { nickname?: string; avatar_url?: string | null; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (body.nickname !== undefined) {
      const nick = body.nickname.trim();
      if (nick.length === 0) {
        return NextResponse.json({ error: '닉네임을 입력하세요' }, { status: 400 });
      }
      if (nick.length > MAX_NICKNAME) {
        return NextResponse.json({ error: `닉네임은 ${MAX_NICKNAME}자 이내` }, { status: 400 });
      }
      updates.nickname = nick;
    }

    if (body.avatar_url !== undefined) {
      // null 또는 URL 문자열. 간단 검증 — 빈 문자열은 null로 처리.
      if (body.avatar_url === null || body.avatar_url === '') {
        updates.avatar_url = null;
      } else if (typeof body.avatar_url === 'string' && /^https?:\/\//i.test(body.avatar_url)) {
        updates.avatar_url = body.avatar_url;
      } else {
        return NextResponse.json({ error: '아바타 URL 형식이 올바르지 않아요' }, { status: 400 });
      }
    }

    // updated_at 외에 실제 변경 없는 경우
    if (updates.nickname === undefined && updates.avatar_url === undefined) {
      return NextResponse.json({ error: '변경할 내용이 없어요' }, { status: 400 });
    }

    // RLS: "Users can update own profile" — auth.uid() = id 만 허용
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[profile/update]', error);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[profile/update]', err);
    return NextResponse.json({ error: '업데이트 실패' }, { status: 500 });
  }
}
