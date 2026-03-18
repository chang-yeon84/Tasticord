'use client';

import { useRouter } from 'next/navigation';
import AiReportCard from '@/components/analysis/AiReportCard';
import TasteSummary from '@/components/analysis/TasteSummary';
import SimilarFriends from '@/components/analysis/SimilarFriends';

// TODO: Replace with real data from API
const mockTags = ['K-pop 매니아', '인디게임 탐험가', 'SF 영화 마니아'];
const mockTasteItems = [
  { label: '가장 많이 들은 곡', title: 'Supernova · aespa', imageUrl: 'https://i.scdn.co/image/ab67616d00004851a1d0e8a78b4e93848cb3f5d4' },
  { label: '가장 많이 플레이한 게임', title: 'Elden Ring · 1,247h', imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_231x87.jpg' },
  { label: '최고 평점 영화', title: 'Interstellar · 4.5', imageUrl: 'https://image.tmdb.org/t/p/w92/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
];
const mockSimilarFriends = [
  { id: '1', nickname: '지수', similarity: 87, commonTastes: 'K-pop, 인디게임 취향 일치' },
  { id: '2', nickname: '민준', similarity: 72, commonTastes: '액션 RPG 게임 취향 일치' },
  { id: '3', nickname: '서연', similarity: 54, commonTastes: 'SF 영화 취향 일치' },
];

export default function AnalysisPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-8">취향 분석</h2>

      <AiReportCard tags={mockTags} onClick={() => router.push('/analysis/report')} />

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 mt-8">나의 취향 요약</h3>
      <TasteSummary items={mockTasteItems} />

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 mt-8">나와 취향이 비슷한 친구</h3>
      <SimilarFriends
        friends={mockSimilarFriends}
        onFriendClick={(id) => router.push(`/friends/${id}`)}
      />
    </div>
  );
}
