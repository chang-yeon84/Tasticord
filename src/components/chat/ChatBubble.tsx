import Avatar from '@/components/ui/Avatar';
import type { ChatMessage } from '@/types';
import { timeAgo } from '@/lib/utils/helpers';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export default function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <Avatar name={message.sender?.nickname || ''} imageUrl={message.sender?.avatar_url} size="sm" />
      )}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="text-xs text-zinc-500 mb-1">{message.sender?.nickname}</div>
        )}
        <div className={`rounded-2xl px-4 py-2 text-sm ${isOwn ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
          {message.content}
        </div>
        <div className={`text-[10px] text-zinc-600 mt-1 ${isOwn ? 'text-right' : ''}`}>
          {timeAgo(message.created_at)}
        </div>
      </div>
    </div>
  );
}
