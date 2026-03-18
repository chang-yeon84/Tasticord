import type { PlaylistSong } from '@/types';

interface SongItemProps {
  song: PlaylistSong;
  index?: number;
}

export default function SongItem({ song, index }: SongItemProps) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-3 flex items-center gap-4">
      {index !== undefined && (
        <span className="w-6 text-center text-sm font-bold text-zinc-600">{index + 1}</span>
      )}
      {song.image_url && (
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center bg-zinc-800"
          style={{ backgroundImage: `url('${song.image_url}')` }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{song.title}</div>
        <div className="text-xs text-zinc-500">{song.artist}{song.album ? ` · ${song.album}` : ''}</div>
      </div>
    </div>
  );
}
