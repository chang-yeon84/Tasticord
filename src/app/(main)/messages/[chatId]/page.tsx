'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import type { ChatMessage, Profile } from '@/types';

const PAGE_SIZE = 30;

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.chatId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [otherLastRead, setOtherLastRead] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const presenceRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseClient = createClient();
  const supabase = supabaseClient;

  // 초기 로드
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // 멤버 정보 (상대방 프로필 + 상대방 last_read_at)
      const { data: members } = await supabase
        .from('chat_members')
        .select('user_id, last_read_at, profile:profiles(*)')
        .eq('room_id', roomId);

      const other = members?.find(m => m.user_id !== user.id);
      if (other?.profile) {
        setOtherUser(other.profile as unknown as Profile);
        setOtherLastRead(other.last_read_at);
      }

      // 최신 메시지 로드
      const { data: prevMessages } = await supabase
        .from('chat_messages')
        .select('*, sender:profiles(*)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      const sorted = (prevMessages || []).reverse() as ChatMessage[];
      setMessages(sorted);
      setHasMore((prevMessages || []).length === PAGE_SIZE);
      setLoading(false);

      // 읽음 처리
      await supabase
        .from('chat_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    }

    init();
  }, [roomId, supabase]);

  // 읽음 처리 함수
  const updateLastRead = useCallback(async () => {
    if (!currentUserId) return;
    await supabase
      .from('chat_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', currentUserId);
  }, [currentUserId, roomId, supabase]);

  // Realtime: 메시지 수신 + 상대방 읽음 상태 감지
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.sender_id === currentUserId) return;

          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, sender: sender as Profile }]);
          updateLastRead();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_members',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as { user_id: string; last_read_at: string };
          // 상대방의 last_read_at이 업데이트되면 읽음 표시 갱신
          if (updated.user_id !== currentUserId) {
            setOtherLastRead(updated.last_read_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, supabase, updateLastRead]);

  // Presence: 타이핑 표시
  useEffect(() => {
    if (!currentUserId) return;

    const presenceChannel = supabase.channel(`typing:${roomId}`, {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const someoneTyping = Object.entries(state).some(([key, presences]) => {
          if (key === currentUserId) return false;
          return (presences as { typing?: boolean }[]).some(p => p.typing);
        });
        setIsTyping(someoneTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ typing: false });
        }
      });

    presenceRef.current = presenceChannel;

    return () => {
      presenceRef.current = null;
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId, currentUserId, supabase]);

  // 타이핑 상태 전송 함수
  const sendTyping = useCallback(() => {
    if (!presenceRef.current) return;

    presenceRef.current.track({ typing: true });

    // 이전 타이머 취소 후 2초 뒤 해제
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      presenceRef.current?.track({ typing: false });
    }, 2000);
  }, []);

  // 새 메시지 올 때 스크롤 하단으로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 스크롤 페이지네이션: 맨 위 도달 시 이전 메시지 로드
  useEffect(() => {
    if (!topRef.current || loading) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || loadingMore || !hasMore) return;

        setLoadingMore(true);
        const oldestMessage = messages[0];
        if (!oldestMessage) {
          setLoadingMore(false);
          return;
        }

        const container = scrollContainerRef.current;
        const prevScrollHeight = container?.scrollHeight || 0;

        const { data: olderMessages } = await supabase
          .from('chat_messages')
          .select('*, sender:profiles(*)')
          .eq('room_id', roomId)
          .lt('created_at', oldestMessage.created_at)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        const sorted = (olderMessages || []).reverse() as ChatMessage[];

        if (sorted.length === 0) {
          setHasMore(false);
        } else {
          setMessages(prev => [...sorted, ...prev]);
          setHasMore(sorted.length === PAGE_SIZE);

          // 스크롤 위치 유지
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - prevScrollHeight;
            }
          });
        }

        setLoadingMore(false);
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, messages, roomId, supabase]);

  // 텍스트 메시지 전송
  const handleSend = async (content: string) => {
    if (!currentUserId) return;

    const tempMessage: ChatMessage = {
      id: crypto.randomUUID(),
      room_id: roomId,
      sender_id: currentUserId,
      content,
      embed_type: null,
      embed_data: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    await supabase.from('chat_messages').insert({
      room_id: roomId,
      sender_id: currentUserId,
      content,
    });
  };

  // 카드 메시지 전송 (음악/게임/영화 추천)
  const handleSendCard = async (embedType: 'music' | 'game' | 'movie' | null, embedData: Record<string, unknown>) => {
    if (!currentUserId || !embedType) return;

    const tempMessage: ChatMessage = {
      id: crypto.randomUUID(),
      room_id: roomId,
      sender_id: currentUserId,
      content: '',
      embed_type: embedType,
      embed_data: embedData,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    await supabase.from('chat_messages').insert({
      room_id: roomId,
      sender_id: currentUserId,
      content: '',
      embed_type: embedType,
      embed_data: embedData,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/messages')}
          className="text-zinc-400 hover:text-white transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {otherUser && (
          <div className="flex items-center gap-3">
            {otherUser.avatar_url ? (
              <img src={otherUser.avatar_url} alt={otherUser.nickname} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
                {otherUser.nickname.slice(0, 1)}
              </div>
            )}
            <div>
              <span className="font-semibold text-sm">{otherUser.nickname}</span>
              {isTyping && (
                <p className="text-[11px] text-purple-400 animate-pulse">입력 중...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* 페이지네이션 상단 감지 요소 */}
        <div ref={topRef} />
        {loadingMore && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-zinc-600 py-20">
            <p>아직 메시지가 없습니다</p>
            <p className="text-sm text-zinc-700 mt-1">첫 메시지를 보내보세요</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            // 내 메시지 중 마지막으로 상대방이 읽은 메시지인지 확인
            const isOwn = msg.sender_id === currentUserId;
            let showRead = false;
            if (isOwn && otherLastRead) {
              const isRead = new Date(otherLastRead) >= new Date(msg.created_at);
              // 읽음 표시는 내 메시지 중 가장 마지막 읽은 메시지에만 표시
              const nextOwnMsg = messages.slice(idx + 1).find(m => m.sender_id === currentUserId);
              if (isRead && (!nextOwnMsg || new Date(otherLastRead) < new Date(nextOwnMsg.created_at))) {
                showRead = true;
              }
            }

            return (
              <div key={msg.id}>
                <ChatBubble message={msg} isOwn={isOwn} showTimestamp={idx === messages.length - 1} />
                {showRead && (
                  <div className="text-[10px] text-purple-400 text-right mt-0.5 mr-1">읽음</div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <ChatInput onSend={handleSend} onSendCard={handleSendCard} onTyping={sendTyping} />
    </div>
  );
}
