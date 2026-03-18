import { PLATFORM_NAMES } from '@/lib/utils/constants';

interface PlatformTagProps {
  platform: string;
}

const platformColorClasses: Record<string, string> = {
  spotify: 'text-green-400',
  apple_music: 'text-pink-400',
  youtube_music: 'text-red-500',
  steam: 'text-zinc-400',
  netflix: 'text-red-400',
  strava: 'text-orange-400',
};

export default function PlatformTag({ platform }: PlatformTagProps) {
  return (
    <span className={`text-[10px] font-semibold ${platformColorClasses[platform] || 'text-zinc-400'}`}>
      {PLATFORM_NAMES[platform] || platform}
    </span>
  );
}
