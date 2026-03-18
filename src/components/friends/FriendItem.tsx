import { ChevronRight } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { Profile } from '@/types';

interface FriendItemProps {
  friend: Profile;
  statusText?: string;
  online?: boolean;
  onClick?: () => void;
}

export default function FriendItem({ friend, statusText, online, onClick }: FriendItemProps) {
  return (
    <div
      onClick={onClick}
      className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all"
    >
      <Avatar name={friend.nickname} imageUrl={friend.avatar_url} online={online} />
      <div className="flex-1 min-w-0">
        <div className="font-medium">{friend.nickname}</div>
        {statusText && <div className="text-xs text-zinc-500 mt-0.5">{statusText}</div>}
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
    </div>
  );
}
