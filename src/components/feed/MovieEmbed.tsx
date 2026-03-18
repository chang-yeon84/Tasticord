import { Star } from 'lucide-react';
import type { Activity } from '@/types';

interface MovieEmbedProps {
  activity: Activity;
}

export default function MovieEmbed({ activity }: MovieEmbedProps) {
  const rating = activity.content_metadata?.rating as number | undefined;
  const year = activity.content_metadata?.year as string | undefined;
  const genre = activity.content_metadata?.genre as string | undefined;

  return (
    <div className="flex space-x-5 items-center bg-black/30 p-4 rounded-xl">
      {activity.content_image_url && (
        <div
          className="w-20 h-28 rounded-lg flex-shrink-0 bg-cover bg-center bg-zinc-800 shadow-xl"
          style={{ backgroundImage: `url('${activity.content_image_url}')` }}
        />
      )}
      <div>
        <h3 className="text-lg font-bold text-white">{activity.content_title}</h3>
        <p className="text-zinc-400 text-sm mt-1">
          {year}{genre ? ` · ${genre}` : ''}
        </p>
        {rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">{rating}</span>
            <span className="text-xs text-zinc-500 ml-1">/ 5</span>
          </div>
        )}
      </div>
    </div>
  );
}
