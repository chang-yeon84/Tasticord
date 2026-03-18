import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

export function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k시간`;
  return `${hours}시간`;
}

export function getInitials(name: string): string {
  return name.slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500/20 text-red-400',
    'bg-blue-500/20 text-blue-400',
    'bg-amber-500/20 text-amber-400',
    'bg-purple-500/20 text-purple-400',
    'bg-green-500/20 text-green-400',
    'bg-pink-500/20 text-pink-400',
    'bg-cyan-500/20 text-cyan-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getSteamImageUrl(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

export function getTmdbPosterUrl(posterPath: string, size: string = 'w200'): string {
  return `https://image.tmdb.org/t/p/${size}/${posterPath}`;
}
