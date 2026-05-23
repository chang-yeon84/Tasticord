// POST /api/wrapped-movies/generate
// 본인의 netflix_history를 집계해 wrapped_movies_reports에 upsert
// 인증 필수 (본인만 본인 카드 생성). 외부 API 호출 없음 — 업로드 시점에 enrichment 완료.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  toRecentMovies,
  toMovieGenreMix,
  toTopGenre,
  toTotalWatched,
  type NetflixRow,
} from '@/lib/wrapped/movie-aggregate';
import { DEFAULT_TONE } from '@/lib/wrapped/tones';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // netflix_history는 RLS상 본인 행만 보이지만, upload route와 동일하게 admin으로 일관 조회
    const admin = createAdminClient();
    const { data: rows, error: fetchError } = await admin
      .from('netflix_history')
      .select('title, date_watched, poster_url, metadata')
      .eq('user_id', user.id)
      .order('date_watched', { ascending: false });

    if (fetchError) {
      console.error('[wrapped-movies/generate] netflix_history 조회 실패', fetchError);
      return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
    }

    const netflixRows = (rows ?? []) as NetflixRow[];
    if (netflixRows.length === 0) {
      return NextResponse.json(
        { error: 'Netflix 시청 기록이 없어요. 프로필에서 CSV를 먼저 업로드해주세요.' },
        { status: 400 }
      );
    }

    const recentMovies = toRecentMovies(netflixRows, 12);
    const genreMix = toMovieGenreMix(netflixRows, 5);
    const topGenre = toTopGenre(netflixRows);
    const totalWatched = toTotalWatched(netflixRows);

    // 푸터 캐시용 프로필
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('wrapped_movies_reports')
      .upsert({
        user_id: user.id,
        tone: DEFAULT_TONE,
        recent_movies: recentMovies,
        genre_mix: genreMix,
        top_genre: topGenre,
        total_watched: totalWatched,
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[wrapped-movies/generate] DB upsert 실패', error);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[wrapped-movies/generate]', err);
    return NextResponse.json({ error: '생성 실패' }, { status: 500 });
  }
}
