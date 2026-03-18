import Avatar from '@/components/ui/Avatar';
import type { Profile } from '@/types';

interface StatItem {
  value: string;
  label: string;
}

interface RankItem {
  rank: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  isPortrait?: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

interface FriendDetailProps {
  friend: Profile;
  platformCount: number;
  topGenre: string;
  totalGameHours: string;
  sections: Array<{
    title: string;
    platform: string;
    items: RankItem[];
  }>;
}

export default function FriendDetail({ friend, platformCount, topGenre, totalGameHours, sections }: FriendDetailProps) {
  const stats: StatItem[] = [
    { value: String(platformCount), label: '플랫폼' },
    { value: topGenre, label: '탑 장르' },
    { value: totalGameHours, label: '총 게임' },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <Avatar name={friend.nickname} imageUrl={friend.avatar_url} size="lg" />
        </div>
        <div className="text-xl font-bold">{friend.nickname}</div>
        <div className="flex justify-center gap-8 mt-5">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="mb-8">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
            {section.title} · {section.platform}
          </h3>
          <div className="space-y-2">
            {section.items.map((item) => (
              <div key={item.rank} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-3 flex items-center gap-4">
                <span className="w-6 text-center text-sm font-bold text-zinc-600">{item.rank}</span>
                {item.imageUrl && (
                  <div
                    className={`${item.isPortrait ? 'w-10 h-14' : 'w-12 h-12'} rounded-lg flex-shrink-0 bg-cover bg-center bg-zinc-800`}
                    style={{ backgroundImage: `url('${item.imageUrl}')` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-zinc-500">{item.subtitle}</div>
                </div>
                {item.actionLabel && item.actionUrl && (
                  <a
                    href={item.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-xs rounded-full border border-zinc-700 text-zinc-400 hover:bg-white hover:text-black transition"
                  >
                    {item.actionLabel}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
