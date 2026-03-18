import type { Activity } from '@/types';

interface MusicEmbedProps {
  activity: Activity;
}

export default function MusicEmbed({ activity }: MusicEmbedProps) {
  return (
    <div className="flex space-x-5 items-center bg-black/30 p-4 rounded-xl">
      {activity.content_image_url && (
        <div
          className="w-28 h-28 rounded-lg flex-shrink-0 bg-cover bg-center bg-zinc-800 shadow-2xl shadow-black/50"
          style={{ backgroundImage: `url('${activity.content_image_url}')` }}
        />
      )}
      <div>
        <h3 className="text-xl font-bold italic text-white">{activity.content_title}</h3>
        {activity.content_subtitle && (
          <p className="text-zinc-400 text-sm mt-1">{activity.content_subtitle}</p>
        )}
        {activity.content_external_url && (
          <a
            href={activity.content_external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-2 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded-full transition-all hover:scale-105 active:scale-95"
          >
            Spotify에서 듣기 ↗
          </a>
        )}
      </div>
    </div>
  );
}
