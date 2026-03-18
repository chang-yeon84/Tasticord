import { Activity, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

interface AiReportCardProps {
  tags: string[];
  onClick?: () => void;
}

export default function AiReportCard({ tags, onClick }: AiReportCardProps) {
  return (
    <GlassCard hover glow="purple" onClick={onClick}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Activity className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-lg">AI 취향 레포트</div>
          <div className="text-sm text-zinc-500 mt-0.5">내 음악·게임·영화 취향을 AI가 종합 분석</div>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {tags.map((tag) => (
          <span key={tag} className="px-3 py-1 rounded-full text-xs bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            {tag}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}
