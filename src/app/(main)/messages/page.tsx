'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import { timeAgo } from '@/lib/utils/helpers';
import type { Profile } from '@/types';

interface ChatRoomItem {
  id: string;
  type: string;
  created_at: string;
  otherUser: Profile | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 내가 참여한 채팅방 목록
      const { data: myMemberships } = await supabase
        .from('chat_members')
        .select('room_id')
        .eq('user_id', user.id);

      if (!myMemberships || myMemberships.length === 0) {
        setLoading(false);
        return;
      }

      const roomIds = myMemberships.map(m => m.room_id);

      // 채팅방 정보 가져오기
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds);

      // 내 멤버십 정보 (last_read_at 포함)
      const { data: myMemberDetails } = await supabase
        .from('chat_members')
        .select('room_id, last_read_at')
        .eq('user_id', user.id);

      const lastReadMap: Record<string, string> = {};
      for (const m of myMemberDetails || []) {
        lastReadMap[m.room_id] = m.last_read_at;
      }

      // 각 채팅방의 상대방 + 마지막 메시지 + 안 읽은 수 가져오기
      const roomItems: ChatRoomItem[] = [];

      for (const room of rooms || []) {
        // 상대방 찾기
        const { data: members } = await supabase
          .from('chat_members')
          .select('user_id, profile:profiles(*)')
          .eq('room_id', room.id);

        const other = members?.find(m => m.user_id !== user.id);

        // 마지막 메시지 (카드 타입 포함)
        const { data: lastMsg } = await supabase
          .from('chat_messages')
          .select('content, embed_type, created_at')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 마지막 메시지 프리뷰: 카드면 타입별 텍스트
        let lastMessagePreview: string | null = null;
        if (lastMsg) {
          if (lastMsg.embed_type === 'music') lastMessagePreview = '🎵 음악 추천 카드';
          else if (lastMsg.embed_type === 'game') lastMessagePreview = '🎮 게임 추천 카드';
          else if (lastMsg.embed_type === 'movie') lastMessagePreview = '🎬 영화/드라마 추천 카드';
          else lastMessagePreview = lastMsg.content || null;
        }

        // 안 읽은 메시지 수
        const lastRead = lastReadMap[room.id];
        let unreadCount = 0;
        if (lastRead) {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', lastRead)
            .neq('sender_id', user.id);
          unreadCount = count || 0;
        }

        roomItems.push({
          id: room.id,
          type: room.type,
          created_at: room.created_at,
          otherUser: (other?.profile as unknown as Profile) || null,
          lastMessage: lastMessagePreview,
          lastMessageAt: lastMsg?.created_at || null,
          unreadCount,
        });
      }

      // 마지막 메시지 시간 기준 정렬
      roomItems.sort((a, b) => {
        const timeA = a.lastMessageAt || a.created_at;
        const timeB = b.lastMessageAt || b.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setChatRooms(roomItems);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  // 새 메시지 수신 시 미리보기·시간·안읽은수 실시간 업데이트
  useEffect(() => {
    const channel = supabase
      .channel('messages-list-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const newMsg = payload.new as {
            room_id: string;
            sender_id: string;
            content: string | null;
            embed_type: string | null;
            created_at: string;
          };

          let preview: string;
          if (newMsg.embed_type === 'music') preview = '🎵 음악 추천 카드';
          else if (newMsg.embed_type === 'game') preview = '🎮 게임 추천 카드';
          else if (newMsg.embed_type === 'movie') preview = '🎬 영화/드라마 추천 카드';
          else preview = newMsg.content || '';

          const { data: { user } } = await supabase.auth.getUser();
          const isOwnMessage = user && newMsg.sender_id === user.id;

          setChatRooms((prev) => {
            const updated = prev.map((room) => {
              if (room.id !== newMsg.room_id) return room;
              return {
                ...room,
                lastMessage: preview,
                lastMessageAt: newMsg.created_at,
                unreadCount: isOwnMessage ? room.unreadCount : room.unreadCount + 1,
              };
            });
            // 최신 메시지 순으로 재정렬
            return updated.sort((a, b) => {
              const timeA = a.lastMessageAt || a.created_at;
              const timeB = b.lastMessageAt || b.created_at;
              return new Date(timeB).getTime() - new Date(timeA).getTime();
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-6">메시지</h2>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">대화</h3>
      {loading ? (
        <div className="space-y-2">
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
          <MessageCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">대화가 없습니다</p>
          <p className="text-zinc-600 text-sm mt-1">친구 페이지에서 메시지를 보내보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chatRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => router.push(`/messages/${room.id}`)}
              className="w-full bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4 hover:bg-zinc-800/50 transition text-left"
            >
              <Avatar
                name={room.otherUser?.nickname || '?'}
                imageUrl={room.otherUser?.avatar_url}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {room.otherUser?.nickname || '알 수 없음'}
                </p>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {room.lastMessage || '메시지가 없습니다'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {room.lastMessageAt && (
                  <span className="text-[10px] text-zinc-400">
                    {timeAgo(room.lastMessageAt)}
                  </span>
                )}
                {room.unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-purple-600 text-[10px] font-bold flex items-center justify-center">
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
