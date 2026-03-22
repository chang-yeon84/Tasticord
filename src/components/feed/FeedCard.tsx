import Avatar from '@/components/ui/Avatar';
import PlatformTag from '@/components/ui/PlatformTag';
import MusicEmbed from './MusicEmbed';
import GameEmbed from './GameEmbed';
import MovieEmbed from './MovieEmbed';
import FeedActions from './FeedActions';
import { timeAgo } from '@/lib/utils/helpers';
import { ACTIVITY_LABELS } from '@/lib/utils/constants';
import type { Activity } from '@/types';

interface FeedCardProps {
  activity: Activity;
}

export default function FeedCard({ activity }: FeedCardProps) {
  const isLive = activity.activity_type === 'listening' || activity.activity_type === 'playing';
  const statusColor = activity.activity_type === 'listening' ? 'text-emerald-400' : activity.activity_type === 'playing' ? 'text-blue-400' : 'text-zinc-400';

  return (
    <div className={`bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-2xl p-6 transition-all hover:scale-[1.005] ${isLive && activity.activity_type === 'listening' ? 'shadow-[0_0_20px_rgba(16,185,129,.12)]' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <Avatar
            name={activity.profile?.nickname || ''}
            imageUrl={activity.profile?.avatar_url}
            online={isLive}
          />
          <div>
            <span className="font-semibold">{activity.profile?.nickname}</span>
            {isLive && (
              <span className={`ml-2 text-xs font-bold tracking-wider uppercase ${statusColor}`}>
                <span className="inline-block animate-pulse">●</span> {ACTIVITY_LABELS[activity.activity_type]}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-500">{timeAgo(activity.created_at)}</span>
          <div className="mt-0.5">
            <PlatformTag platform={activity.platform} />
          </div>
        </div>
      </div>

      {['spotify', 'apple_music'].includes(activity.platform) && (
        <MusicEmbed activity={activity} />
      )}
      {activity.platform === 'steam' && <GameEmbed activity={activity} />}
      {activity.platform === 'netflix' && <MovieEmbed activity={activity} />}

      <FeedActions
        activityId={activity.id}
        likesCount={activity.likes_count || 0}
        commentsCount={activity.comments_count || 0}
        isLiked={activity.is_liked || false}
      />
    </div>
  );
}
