interface PlaylistCardProps {
  name: string;
  memberNames: string;
  songCount: number;
  durationText: string;
  coverImages: string[];
  songs?: Array<{ title: string; artist: string; imageUrl?: string; addedBy?: string }>;
  onClick?: () => void;
}

export default function PlaylistCard({ name, memberNames, songCount, durationText, coverImages, songs = [], onClick }: PlaylistCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-2xl p-5 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 flex-shrink-0">
          {coverImages.slice(0, 4).map((url, i) => (
            <div key={i} className="bg-cover bg-center bg-zinc-800" style={{ backgroundImage: `url('${url}')` }} />
          ))}
        </div>
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-zinc-500 mt-0.5">{memberNames} · {songCount}곡 · {durationText}</div>
        </div>
      </div>
      {songs.length > 0 && (
        <div className="space-y-2">
          {songs.map((song, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-t border-zinc-800/50">
              {song.imageUrl && (
                <div
                  className="w-9 h-9 rounded-md flex-shrink-0 bg-cover bg-center bg-zinc-800"
                  style={{ backgroundImage: `url('${song.imageUrl}')` }}
                />
              )}
              <div className="flex-1 text-sm truncate">{song.title} — {song.artist}</div>
              {song.addedBy && (
                <span className="text-[11px] text-zinc-600 px-2 py-0.5 bg-zinc-800/50 rounded-full">{song.addedBy}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
