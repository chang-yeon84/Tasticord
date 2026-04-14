'use client';

import Avatar from '@/components/ui/Avatar';
import type { Profile } from '@/types';

interface TypingBubbleProps {
  user: Profile;
}

export default function TypingBubble({ user }: TypingBubbleProps) {
  return (
    <div className="flex gap-3">
      <Avatar name={user.nickname || ''} imageUrl={user.avatar_url} size="sm" />
      <div>
        <div className="text-xs text-zinc-500 mb-1">{user.nickname}</div>
        <div className="rounded-2xl px-4 py-3 bg-zinc-800 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
