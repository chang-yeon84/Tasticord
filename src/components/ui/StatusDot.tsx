interface StatusDotProps {
  status: 'online' | 'offline' | 'full' | 'limited';
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-zinc-600',
  full: 'bg-green-500',
  limited: 'bg-amber-500',
};

export default function StatusDot({ status }: StatusDotProps) {
  return <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />;
}
