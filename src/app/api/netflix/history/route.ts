import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 넷플릭스 시청 기록 조회 API
// - 전체 작품 목록 (최신순)
// - 최근 한 달 시청 수
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // admin 클라이언트로 조회 (RLS 우회)
    const admin = createAdminClient();
    const { data: history, error } = await admin
      .from('netflix_history')
      .select('*')
      .eq('user_id', user.id)
      .order('date_watched', { ascending: false });

    if (error) {
      console.error('Netflix history fetch error:', error);
    }

    if (!history || history.length === 0) {
      return NextResponse.json({ history: [], recentCount: 0, totalCount: 0 });
    }

    // 최근 한 달 시청 수 계산
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recentCount = history.filter(
      h => h.date_watched && new Date(h.date_watched) >= oneMonthAgo
    ).length;

    return NextResponse.json({
      history,
      recentCount,
      totalCount: history.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
