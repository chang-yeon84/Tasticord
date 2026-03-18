import type { Activity } from '@/types';

interface GameEmbedProps {
  activity: Activity;
}

export default function GameEmbed({ activity }: GameEmbedProps) {
  const playtime = activity.content_metadata?.playtime_hours as number | undefined;

  return (
    <div className="w-full h-44 rounded-xl overflow-hidden relative">
      {activity.content_image_url && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-zinc-800"
          style={{ backgroundImage: `url('${activity.content_image_url}')` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute bottom-4 left-5">
        <h3 className="text-lg font-bold text-white">{activity.content_title}</h3>
        {playtime && <p className="text-xs text-zinc-400">{playtime}시간 플레이</p>}
      </div>
      {activity.content_external_url && (
        <div className="absolute bottom-4 right-5">
          <a
            href={activity.content_external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold rounded-full border border-zinc-600/50 transition-all hover:scale-105 text-white"
          >
            Steam에서 보기 ↗
          </a>
        </div>
      )}
    </div>
  );
}
