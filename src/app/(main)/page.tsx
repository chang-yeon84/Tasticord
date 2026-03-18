'use client';

import { useState } from 'react';
import FeedCard from '@/components/feed/FeedCard';
import Chip from '@/components/ui/Chip';
import { useFeed } from '@/hooks/useFeed';
import { FEED_FILTERS } from '@/lib/utils/constants';

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState('전체');
  const { activities, loading, hasMore, loadMore } = useFeed(activeFilter);

  return (
    <div className="animate-fade-up">
      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-8 py-4">
        <div className="flex space-x-2 max-w-3xl mx-auto">
          {FEED_FILTERS.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              active={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            />
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        {loading && activities.length === 0 ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800" />
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-zinc-800 rounded" />
                    <div className="w-16 h-3 bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="w-full h-32 bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-zinc-600 text-lg">아직 피드가 없습니다</div>
            <p className="text-zinc-700 text-sm mt-2">플랫폼을 연동하고 친구를 추가해보세요</p>
          </div>
        ) : (
          <>
            {activities.map((activity) => (
              <FeedCard key={activity.id} activity={activity} />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-300 transition"
              >
                더 보기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
