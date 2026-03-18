'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import type { ChatMessage } from '@/types';

export default function ChatRoomPage() {
  const params = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      room_id: params.chatId as string,
      sender_id: 'me',
      content,
      embed_type: null,
      embed_data: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    // TODO: Send via Supabase Realtime
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800/50 px-6 py-4">
        <h2 className="font-semibold">채팅</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 py-20">메시지가 없습니다</div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isOwn={msg.sender_id === 'me'} />
        ))}
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
}
