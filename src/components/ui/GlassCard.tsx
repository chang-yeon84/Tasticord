interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'purple' | 'green' | null;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', hover = false, glow = null, onClick }: GlassCardProps) {
  const glowClass = glow === 'purple' ? 'shadow-[0_0_20px_rgba(124,58,237,.15)]' : glow === 'green' ? 'shadow-[0_0_20px_rgba(16,185,129,.12)]' : '';
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-2xl p-6 transition-all ${hover ? 'hover:bg-zinc-800/60 hover:border-zinc-700/50 cursor-pointer' : ''} ${glowClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
