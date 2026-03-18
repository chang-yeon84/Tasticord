'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AiReportCard from '@/components/analysis/AiReportCard';
import TasteSummary from '@/components/analysis/TasteSummary';
import SimilarFriends from '@/components/analysis/SimilarFriends';

export default function AnalysisPage() {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('taste_reports')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      setReport(data);
      setLoading(false);
    }
    fetchReport();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-8">취향 분석</h2>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800" />
              <div className="space-y-2 flex-1">
                <div className="w-32 h-5 bg-zinc-800 rounded" />
                <div className="w-48 h-3 bg-zinc-800 rounded" />
              </div>
            </div>
          </div>
        </div>
      ) : report ? (
        <>
          <AiReportCard
            tags={report.tags || []}
            onClick={() => router.push('/analysis/report')}
          />

          {report.report_data?.top_artists?.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 mt-8">나의 취향 요약</h3>
              <TasteSummary items={
                [
                  ...(report.report_data.top_artists?.slice(0, 1).map((a: any) => ({
                    label: '가장 많이 들은 아티스트',
                    title: a.name,
                    imageUrl: a.image_url,
                  })) || []),
                  ...(report.report_data.top_games?.slice(0, 1).map((g: any) => ({
                    label: '가장 많이 플레이한 게임',
                    title: `${g.name} · ${g.playtime_hours}h`,
                    imageUrl: g.image_url,
                  })) || []),
                  ...(report.report_data.top_movies?.slice(0, 1).map((m: any) => ({
                    label: '최고 평점 영화',
                    title: `${m.name} · ${m.rating}`,
                    imageUrl: m.image_url,
                  })) || []),
                ]
              } />
            </>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="text-zinc-600 text-lg">아직 분석 데이터가 없습니다</div>
          <p className="text-zinc-700 text-sm mt-2">플랫폼을 연동하면 AI가 취향을 분석해드립니다</p>
        </div>
      )}
    </div>
  );
}
