'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface FeedActionsProps {
  activityId: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export default function FeedActions({ activityId, likesCount, commentsCount, isLiked: initialIsLiked }: FeedActionsProps) {
  const [liked, setLiked] = useState(initialIsLiked);
  const [likes, setLikes] = useState(likesCount);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    // TODO: API call to toggle like
  };

  return (
    <div className="flex gap-1 mt-4">
      <button
        onClick={handleLike}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition ${
          liked ? 'text-pink-400 hover:text-pink-300' : 'text-zinc-500 hover:text-zinc-300'
        } hover:bg-zinc-800/50`}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-pink-400' : ''}`} />
        {likes > 0 && likes}
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition">
        <MessageCircle className="w-4 h-4" />
        {commentsCount > 0 && commentsCount}
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition">
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
}
