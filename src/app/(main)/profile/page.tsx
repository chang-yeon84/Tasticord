'use client';

import { useAuth } from '@/hooks/useAuth';
import StatusDot from '@/components/ui/StatusDot';

const platforms = [
  { name: 'Spotify', desc: '연동됨 · 실시간 재생', status: 'full' as const, icon: '🎵', bgColor: 'bg-green-600' },
  { name: 'Apple Music', desc: '연동됨 · 실시간 재생', status: 'full' as const, icon: '🎶', bgColor: 'bg-pink-600' },
  { name: 'YouTube Music', desc: '좋아요/플레이리스트만', status: 'limited' as const, icon: '▶️', bgColor: 'bg-red-600' },
  { name: 'Steam', desc: '연동됨 · 게임 47개', status: 'full' as const, icon: '🎮', bgColor: 'bg-zinc-800' },
  { name: 'Netflix', desc: 'CSV 업로드 · 수동 갱신', status: 'limited' as const, icon: '🎬', bgColor: 'bg-red-700' },
];

export default function ProfilePage() {
  const { currentUser, signOut } = useAuth();

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-8">프로필</h2>
      <div className="text-center mb-8">
        {currentUser?.avatar_url ? (
          <img src={currentUser.avatar_url} alt={currentUser.nickname} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-black">
            {currentUser?.nickname?.slice(0, 1) || '나'}
          </div>
        )}
        <div className="text-xl font-bold">{currentUser?.nickname || '내 이름'}</div>
        <div className="text-sm text-zinc-500 mt-1">카카오톡으로 로그인됨</div>
        <div className="flex justify-center gap-8 mt-5">
          <div className="text-center"><div className="text-xl font-bold">5</div><div className="text-xs text-zinc-500 mt-0.5">연동 플랫폼</div></div>
          <div className="text-center"><div className="text-xl font-bold">12</div><div className="text-xs text-zinc-500 mt-0.5">카톡 친구</div></div>
        </div>
      </div>
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">연동된 플랫폼</h3>
      <div className="space-y-2">
        {platforms.map((p) => (
          <div key={p.name} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${p.bgColor} flex items-center justify-center flex-shrink-0 text-lg`}>{p.icon}</div>
            <div className="flex-1"><div className="font-medium text-sm">{p.name}</div><div className="text-xs text-zinc-500">{p.desc}</div></div>
            <StatusDot status={p.status} />
          </div>
        ))}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4 opacity-40 cursor-pointer hover:opacity-60 transition">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-500 text-xl">+</div>
          <div className="flex-1"><div className="font-medium text-sm text-zinc-500">플랫폼 추가</div></div>
        </div>
      </div>
      <button onClick={signOut} className="w-full mt-8 py-3 text-sm text-zinc-500 hover:text-red-400 transition border border-zinc-800 rounded-xl hover:border-red-900/50">로그아웃</button>
    </div>
  );
}
