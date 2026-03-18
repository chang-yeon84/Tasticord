'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

// TODO: fetch real data
const mockReport = {
  summary: '당신은 트렌드에 민감한 K-pop 팬이면서 게임에서는 하드코어 RPG를 즐기는 조합이에요. 영화는 SF와 스릴러를 선호하며 깊은 세계관에 몰입해요.',
  topArtists: [
    { name: 'aespa', imageUrl: 'https://i.scdn.co/image/ab67616d00004851a1d0e8a78b4e93848cb3f5d4' },
    { name: 'NewJeans', imageUrl: 'https://i.scdn.co/image/ab67616d00004851b657fbb27b17e7bd4691d2b2' },
  ],
  topGames: [
    { name: 'Elden Ring', hours: '1,247시간', imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_231x87.jpg' },
    { name: 'Stardew Valley', hours: '892시간', imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/capsule_231x87.jpg' },
  ],
};

export default function ReportPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <button
        onClick={() => router.push('/analysis')}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6 text-sm"
      >
        <ChevronLeft className="w-5 h-5" />
        AI 취향 레포트
      </button>

      <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-purple-500/15 to-pink-500/10 border border-purple-500/20">
        <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">AI 분석 결과</div>
        <div className="text-base leading-relaxed" dangerouslySetInnerHTML={{
          __html: mockReport.summary
            .replace(/트렌드에 민감한 K-pop 팬/g, '<strong class="text-white">트렌드에 민감한 K-pop 팬</strong>')
            .replace(/하드코어 RPG/g, '<strong class="text-white">하드코어 RPG</strong>')
            .replace(/SF와 스릴러/g, '<strong class="text-white">SF와 스릴러</strong>')
        }} />
      </div>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">탑 아티스트</h3>
      <div className="space-y-3 mb-8">
        {mockReport.topArtists.map((artist, i) => (
          <div key={artist.name} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cover bg-center bg-zinc-800" style={{ backgroundImage: `url('${artist.imageUrl}')` }} />
            <div>
              <div className="text-xs text-zinc-500">{i + 1}위</div>
              <div className="font-semibold">{artist.name}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">탑 게임</h3>
      <div className="space-y-3">
        {mockReport.topGames.map((game, i) => (
          <div key={game.name} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cover bg-center bg-zinc-800" style={{ backgroundImage: `url('${game.imageUrl}')` }} />
            <div>
              <div className="text-xs text-zinc-500">{i + 1}위 · {game.hours}</div>
              <div className="font-semibold">{game.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
