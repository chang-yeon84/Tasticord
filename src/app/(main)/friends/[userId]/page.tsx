'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

const mockFriend = {
  nickname: '지수',
  platformCount: 3,
  topGenre: 'K-pop',
  totalGameHours: '538h',
  platforms: 'Spotify · Steam · Netflix 연동',
  topTracks: [
    { rank: 1, title: 'Supernova', subtitle: 'aespa · 342회', imageUrl: 'https://i.scdn.co/image/ab67616d00004851a1d0e8a78b4e93848cb3f5d4' },
    { rank: 2, title: 'APT.', subtitle: 'ROSE, Bruno Mars · 287회', imageUrl: 'https://i.scdn.co/image/ab67616d00004851e2e352d89826aef6dbd5ff8f' },
  ],
  topGames: [
    { rank: 1, title: 'Stardew Valley', subtitle: '382시간', imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/capsule_231x87.jpg' },
    { rank: 2, title: 'Elden Ring', subtitle: '156시간', imageUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_231x87.jpg' },
  ],
  topMovies: [
    { rank: 1, title: 'Interstellar', subtitle: '평점 5.0', imageUrl: 'https://image.tmdb.org/t/p/w92/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', isPortrait: true },
    { rank: 2, title: '기생충', subtitle: '평점 4.5', imageUrl: 'https://image.tmdb.org/t/p/w92/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', isPortrait: true },
  ],
};

export default function FriendDetailPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <button
        onClick={() => router.push('/friends')}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6 text-sm"
      >
        <ChevronLeft className="w-5 h-5" />
        프로필
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-2xl mx-auto mb-3">
          {mockFriend.nickname.slice(0, 2)}
        </div>
        <div className="text-xl font-bold">{mockFriend.nickname}</div>
        <div className="text-sm text-zinc-500 mt-1">{mockFriend.platforms}</div>
        <div className="flex justify-center gap-8 mt-5">
          <div className="text-center"><div className="text-xl font-bold">{mockFriend.platformCount}</div><div className="text-xs text-zinc-500 mt-0.5">플랫폼</div></div>
          <div className="text-center"><div className="text-xl font-bold">{mockFriend.topGenre}</div><div className="text-xs text-zinc-500 mt-0.5">탑 장르</div></div>
          <div className="text-center"><div className="text-xl font-bold">{mockFriend.totalGameHours}</div><div className="text-xs text-zinc-500 mt-0.5">총 게임</div></div>
        </div>
      </div>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">가장 많이 들은 곡 · Spotify</h3>
      <div className="space-y-2 mb-8">
        {mockFriend.topTracks.map((item) => (
          <div key={item.rank} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-3 flex items-center gap-4">
            <span className="w-6 text-center text-sm font-bold text-zinc-600">{item.rank}</span>
            <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center bg-zinc-800" style={{ backgroundImage: `url('${item.imageUrl}')` }} />
            <div className="flex-1 min-w-0"><div className="font-medium text-sm">{item.title}</div><div className="text-xs text-zinc-500">{item.subtitle}</div></div>
            <button className="px-3 py-1 text-xs rounded-full border border-zinc-700 text-zinc-400 hover:bg-white hover:text-black transition">듣기 ↗</button>
          </div>
        ))}
      </div>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">가장 많이 플레이한 게임 · Steam</h3>
      <div className="space-y-2 mb-8">
        {mockFriend.topGames.map((item) => (
          <div key={item.rank} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-3 flex items-center gap-4">
            <span className="w-6 text-center text-sm font-bold text-zinc-600">{item.rank}</span>
            <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center bg-zinc-800" style={{ backgroundImage: `url('${item.imageUrl}')` }} />
            <div className="flex-1 min-w-0"><div className="font-medium text-sm">{item.title}</div><div className="text-xs text-zinc-500">{item.subtitle}</div></div>
            <button className="px-3 py-1 text-xs rounded-full border border-zinc-700 text-zinc-400 hover:bg-white hover:text-black transition">Steam ↗</button>
          </div>
        ))}
      </div>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">가장 많이 본 콘텐츠 · Netflix</h3>
      <div className="space-y-2">
        {mockFriend.topMovies.map((item) => (
          <div key={item.rank} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-3 flex items-center gap-4">
            <span className="w-6 text-center text-sm font-bold text-zinc-600">{item.rank}</span>
            <div className={`${item.isPortrait ? 'w-10 h-14' : 'w-12 h-12'} rounded-md flex-shrink-0 bg-cover bg-center bg-zinc-800`} style={{ backgroundImage: `url('${item.imageUrl}')` }} />
            <div className="flex-1 min-w-0"><div className="font-medium text-sm">{item.title}</div><div className="text-xs text-zinc-500">{item.subtitle}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
