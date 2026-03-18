import SongItem from './SongItem';
import type { PlaylistSong } from '@/types';

interface PlaylistDetailProps {
  name: string;
  songs: PlaylistSong[];
}

export default function PlaylistDetail({ name, songs }: PlaylistDetailProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{name}</h2>
      <div className="space-y-1">
        {songs.map((song) => (
          <SongItem key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}
