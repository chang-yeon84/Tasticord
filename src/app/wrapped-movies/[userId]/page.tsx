// 공개 공유 페이지 — /wrapped-movies/[userId]
// 비로그인자도 접속 가능 (미들웨어에서 exclude)
// 음악/게임 Wrapped와 동일한 패턴 — 서버 컴포넌트에서 데이터 미리 조회
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { TONES, type ToneId } from '@/lib/wrapped/tones';
import type { WrappedMoviesReport } from '@/lib/wrapped/movie-types';
import WrappedMoviesView from './WrappedMoviesView';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function WrappedMoviesSharePage({ params }: Props) {
  const { userId } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('wrapped_movies_reports')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    notFound();
  }

  const report = data as WrappedMoviesReport;
  const tone = TONES[(report.tone as ToneId) ?? 'A'];

  return <WrappedMoviesView report={report} tone={tone} />;
}
