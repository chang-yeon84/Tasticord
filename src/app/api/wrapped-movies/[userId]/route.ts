// GET /api/wrapped-movies/[userId]
// 공개 조회 — 비로그인자도 OK (service-role로 RLS 우회)
// 카드 페이지(/wrapped-movies/[userId])가 호출
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('wrapped_movies_reports')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
