// GET /api/friends/[userId]/compare
// 본인 + 대상(친구) taste_profiles 2개를 읽어 축별 유사도를 계산해 반환.
// 인증 필수. RLS("Users can read friend taste profiles")가 본인+친구로 제한하므로
// authenticated client로 조회 → 친구 아닌 사용자 프로필은 자연히 안 보임.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { compareTasteProfiles, type TasteProfileData } from '@/lib/compare/compare';

const EMPTY: TasteProfileData = {
  music: { artists: [], genres: [] },
  games: { games: [], genres: [] },
  movies: { titles: [], genres: [] },
};

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { userId: friendId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (friendId === user.id) {
      return NextResponse.json({ error: '자기 자신과는 비교할 수 없어요' }, { status: 400 });
    }

    const { data: rows, error } = await supabase
      .from('taste_profiles')
      .select('user_id, music, games, movies')
      .in('user_id', [user.id, friendId]);

    if (error) {
      console.error('[friends/compare] 조회 실패', error);
      return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }

    const byId = new Map((rows ?? []).map((r) => [r.user_id, r]));
    const mineRow = byId.get(user.id);
    const friendRow = byId.get(friendId);

    if (!mineRow) {
      return NextResponse.json(
        { error: '내 취향 데이터가 아직 준비되지 않았어요. 잠시 후 다시 시도해주세요.', code: 'MINE_MISSING' },
        { status: 409 }
      );
    }
    if (!friendRow) {
      return NextResponse.json(
        { error: '이 친구의 취향 데이터가 아직 없어요. 친구가 앱을 한 번 켜면 생성돼요.', code: 'FRIEND_MISSING' },
        { status: 409 }
      );
    }

    const mine: TasteProfileData = {
      music: { ...EMPTY.music, ...(mineRow.music ?? {}) },
      games: { ...EMPTY.games, ...(mineRow.games ?? {}) },
      movies: { ...EMPTY.movies, ...(mineRow.movies ?? {}) },
    };
    const friend: TasteProfileData = {
      music: { ...EMPTY.music, ...(friendRow.music ?? {}) },
      games: { ...EMPTY.games, ...(friendRow.games ?? {}) },
      movies: { ...EMPTY.movies, ...(friendRow.movies ?? {}) },
    };

    const result = compareTasteProfiles(mine, friend);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[friends/compare]', err);
    return NextResponse.json({ error: '비교 실패' }, { status: 500 });
  }
}
