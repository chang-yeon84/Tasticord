'use client';

import PlaylistCard from '@/components/playlist/PlaylistCard';

// TODO: Replace with real data
const mockPlaylist = {
  name: '주말 드라이브 플리',
  memberNames: '나, 지수, 민준',
  songCount: 12,
  durationText: '48분',
  coverImages: [
    'https://i.scdn.co/image/ab67616d00004851e2e352d89826aef6dbd5ff8f',
    'https://i.scdn.co/image/ab67616d000048514718e2b124f79258be7571c1',
    'https://i.scdn.co/image/ab67616d00004851a1d0e8a78b4e93848cb3f5d4',
    'https://i.scdn.co/image/ab67616d00004851b657fbb27b17e7bd4691d2b2',
  ],
  songs: [
    { title: 'APT.', artist: 'ROSE, Bruno Mars', imageUrl: 'https://i.scdn.co/image/ab67616d00004851e2e352d89826aef6dbd5ff8f', addedBy: '지수' },
    { title: 'Blinding Lights', artist: 'The Weeknd', imageUrl: 'https://i.scdn.co/image/ab67616d000048514718e2b124f79258be7571c1', addedBy: '나' },
    { title: 'Supernova', artist: 'aespa', imageUrl: 'https://i.scdn.co/image/ab67616d00004851a1d0e8a78b4e93848cb3f5d4', addedBy: '민준' },
  ],
};

const mockChats = [
  { id: '1', name: '지수', lastMessage: '이 노래 플리에 넣자!', time: '방금', unread: 2, color: 'bg-red-500/20 text-red-400' },
  { id: '2', name: '민준', lastMessage: '엘든링 DLC 해봤어?', time: '1시간', unread: 0, color: 'bg-blue-500/20 text-blue-400' },
];

export default function MessagesPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-6">메시지</h2>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">공동 플레이리스트</h3>
      <div className="mb-8">
        <PlaylistCard {...mockPlaylist} />
      </div>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">대화</h3>
      <div className="space-y-1">
        {mockChats.map((chat) => (
          <div
            key={chat.id}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all"
          >
            <div className={`w-12 h-12 rounded-full ${chat.color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
              {chat.name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{chat.name}</div>
              <div className="text-xs text-zinc-500 truncate mt-0.5">{chat.lastMessage}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] text-zinc-600">{chat.time}</div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-pink-500 text-[10px] font-bold flex items-center justify-center mt-1 ml-auto">
                  {chat.unread}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
