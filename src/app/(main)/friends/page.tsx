'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types';

const mockFriends = [
  { id: '1', nickname: '지수', status: 'Spotify · Supernova 듣는 중', online: true, color: 'bg-red-500/20 text-red-400' },
  { id: '2', nickname: '민준', status: 'Steam · Elden Ring 플레이 중', online: true, color: 'bg-blue-500/20 text-blue-400' },
  { id: '3', nickname: '서연', status: '최근: Interstellar 시청', online: false, color: 'bg-amber-500/20 text-amber-400' },
  { id: '4', nickname: '현우', status: '최근: 한강 러닝 5.2km', online: false, color: 'bg-green-500/20 text-green-400' },
  { id: '5', nickname: '하준', status: 'YouTube Music · 좋아요 42곡', online: false, color: 'bg-purple-500/20 text-purple-400' },
];

export default function FriendsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = mockFriends.filter((f) =>
    f.nickname.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-6">친구</h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 px-5 rounded-full bg-zinc-900 border border-zinc-800 text-sm placeholder-zinc-600 outline-none focus:border-zinc-600 transition mb-6"
        placeholder="친구 검색..."
      />

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
        카카오톡 친구 · {filtered.length}명
      </h3>

      <div className="space-y-1">
        {filtered.map((friend) => (
          <div
            key={friend.id}
            onClick={() => router.push(`/friends/${friend.id}`)}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all"
          >
            <div className={`w-12 h-12 rounded-full ${friend.color} flex items-center justify-center font-bold text-sm relative flex-shrink-0`}>
              {friend.nickname.slice(0, 2)}
              {friend.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-zinc-950" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{friend.nickname}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{friend.status}</div>
            </div>
            <svg className="w-4 h-4 text-zinc-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
