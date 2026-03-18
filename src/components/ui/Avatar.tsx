import { getInitials, getAvatarColor } from '@/lib/utils/helpers';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
}

const sizeClasses = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-24 h-24 text-3xl',
};

export default function Avatar({ name, imageUrl, size = 'md', online }: AvatarProps) {
  const colorClass = getAvatarColor(name);

  return (
    <div className={`relative flex-shrink-0 ${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${imageUrl ? '' : colorClass}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className={`${sizeClasses[size]} rounded-full object-cover`} />
      ) : (
        getInitials(name)
      )}
      {online !== undefined && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${online ? 'bg-green-500' : 'bg-zinc-600'}`} />
      )}
    </div>
  );
}
