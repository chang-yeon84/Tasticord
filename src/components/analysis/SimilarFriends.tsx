import Avatar from '@/components/ui/Avatar';

interface SimilarFriend {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  similarity: number;
  commonTastes: string;
}

interface SimilarFriendsProps {
  friends: SimilarFriend[];
  onFriendClick?: (id: string) => void;
}

export default function SimilarFriends({ friends, onFriendClick }: SimilarFriendsProps) {
  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <div
          key={friend.id}
          onClick={() => onFriendClick?.(friend.id)}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all"
        >
          <Avatar name={friend.nickname} imageUrl={friend.avatar_url} />
          <div className="flex-1">
            <div className="font-medium">{friend.nickname}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{friend.commonTastes}</div>
          </div>
          <span className="text-purple-400 font-bold">{friend.similarity}%</span>
        </div>
      ))}
    </div>
  );
}
