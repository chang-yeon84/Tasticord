import Avatar from '@/components/ui/Avatar';
import type { ChatMessage } from '@/types';
import { timeAgo } from '@/lib/utils/helpers';
import MessageCard from './MessageCard';

/**
 * 채팅 메시지 한 개를 렌더링하는 컴포넌트
 *
 * 분기:
 * - embed_type이 있으면 → MessageCard 렌더링 (카드 메시지)
 * - content만 있으면 → 일반 텍스트 버블 렌더링
 */

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showTimestamp?: boolean;
}

export default function ChatBubble({ message, isOwn, showTimestamp = false }: ChatBubbleProps) {
  const hasEmbed = !!message.embed_type && !!message.embed_data;

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <Avatar name={message.sender?.nickname || ''} imageUrl={message.sender?.avatar_url} size="sm" />
      )}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="text-xs text-zinc-500 mb-1">{message.sender?.nickname}</div>
        )}

        {/* 카드 메시지 vs 일반 텍스트 */}
        {hasEmbed ? (
          <MessageCard
            embedType={message.embed_type}
            embedData={message.embed_data as Record<string, unknown>}
            isOwn={isOwn}
          />
        ) : (
          <div className={`rounded-2xl px-4 py-2 text-sm ${isOwn ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
            {message.content}
          </div>
        )}

        {showTimestamp && (
          <div className={`text-[10px] text-zinc-600 mt-1 ${isOwn ? 'text-right' : ''}`}>
            {timeAgo(message.created_at)}
          </div>
        )}
      </div>
    </div>
  );
}
