'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function MessagesPage() {
  const [playlists, setPlaylists] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch shared playlists
      const { data: playlistData } = await supabase
        .from('playlist_members')
        .select('playlist:shared_playlists(*)')
        .eq('user_id', user.id);

      setPlaylists((playlistData || []) as any);

      // Fetch chat rooms
      const { data: chatData } = await supabase
        .from('chat_members')
        .select('room:chat_rooms(*, last_message:chat_messages(content, created_at))')
        .eq('user_id', user.id);

      setChatRooms((chatData || []) as any);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-6">메시지</h2>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">공동 플레이리스트</h3>
      {loading ? (
        <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-5 animate-pulse mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-zinc-800" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-zinc-800 rounded" />
              <div className="w-48 h-3 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      ) : playlists.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-8 text-center mb-8">
          <p className="text-zinc-600">공동 플레이리스트가 없습니다</p>
          <p className="text-zinc-700 text-sm mt-1">친구와 함께 플레이리스트를 만들어보세요</p>
        </div>
      ) : null}

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">대화</h3>
      {loading ? (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800" />
              <div className="space-y-2 flex-1">
                <div className="w-20 h-4 bg-zinc-800 rounded" />
                <div className="w-40 h-3 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : chatRooms.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-8 text-center">
          <p className="text-zinc-600">대화가 없습니다</p>
          <p className="text-zinc-700 text-sm mt-1">친구에게 메시지를 보내보세요</p>
        </div>
      ) : null}
    </div>
  );
}
