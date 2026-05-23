'use client';

// 친구 상세 페이지의 "취향 비교" 섹션
// /api/friends/[userId]/compare 결과를 종합 점수 + 축별 카드로 렌더
import { useEffect, useState, useCallback } from 'react';
import { Music, Gamepad2, Film, RefreshCw } from 'lucide-react';
import type { CompareResult, AxisCompare } from '@/lib/compare/compare';

interface Props {
  friendId: string;
  friendName: string;
}

const AXIS_META = {
  music: { label: '음악', icon: Music, accent: 'text-green-400', bar: 'bg-green-500' },
  games: { label: '게임', icon: Gamepad2, accent: 'text-cyan-400', bar: 'bg-cyan-500' },
  movies: { label: '영화', icon: Film, accent: 'text-red-400', bar: 'bg-red-500' },
} as const;

function ChipRow({ items, max = 8 }: { items: string[]; max?: number }) {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((it) => (
        <span
          key={it}
          className="px-2.5 py-1 rounded-full bg-zinc-800/70 border border-zinc-700/50 text-xs text-zinc-300"
        >
          {it}
        </span>
      ))}
      {rest > 0 && <span className="px-2.5 py-1 text-xs text-zinc-500">+{rest}</span>}
    </div>
  );
}

function AxisCard({
  axisKey,
  axis,
  friendName,
}: {
  axisKey: keyof typeof AXIS_META;
  axis: AxisCompare;
  friendName: string;
}) {
  const meta = AXIS_META[axisKey];
  const Icon = meta.icon;

  if (!axis.available) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-5 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${meta.accent}`} />
          <span className="font-semibold text-sm">{meta.label}</span>
        </div>
        <p className="text-xs text-zinc-500">
          둘 중 한 명의 {meta.label} 데이터가 없어 비교할 수 없어요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${meta.accent}`} />
          <span className="font-semibold text-sm">{meta.label}</span>
        </div>
        <span className={`text-lg font-bold ${meta.accent}`}>{axis.score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-4">
        <div className={`h-full ${meta.bar} transition-all`} style={{ width: `${axis.score}%` }} />
      </div>

      {axis.commonItems.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] text-zinc-500 mb-1.5">공통 {axis.itemsLabel}</div>
          <ChipRow items={axis.commonItems} />
        </div>
      )}
      {axis.commonGenres.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] text-zinc-500 mb-1.5">공통 장르</div>
          <ChipRow items={axis.commonGenres} />
        </div>
      )}
      {axis.commonItems.length === 0 && axis.commonGenres.length === 0 && (
        <p className="text-xs text-zinc-500 mb-3">겹치는 항목이 없어요. 정반대 취향!</p>
      )}
      {axis.newFromFriend.length > 0 && (
        <div>
          <div className="text-[11px] text-zinc-500 mb-1.5">
            {friendName}님이 좋아하는 {axis.itemsLabel}
          </div>
          <ChipRow items={axis.newFromFriend} />
        </div>
      )}
    </div>
  );
}

export default function TasteCompare({ friendId, friendName }: Props) {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const res = await fetch(`/api/friends/${friendId}/compare`);
      const json = await res.json();
      if (!res.ok) {
        setErrMsg(json.error ?? '비교 정보를 불러오지 못했어요');
        setResult(null);
        return;
      }
      setResult(json as CompareResult);
    } catch {
      setErrMsg('네트워크 오류로 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-6 animate-pulse h-28" />
        <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-6 animate-pulse h-40" />
      </div>
    );
  }

  if (errMsg || !result) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-6 text-center">
        <p className="text-zinc-400 text-sm">{errMsg ?? '비교 정보가 없어요'}</p>
        <button
          onClick={load}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 종합 점수 */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-500/15 to-pink-500/10 border border-purple-500/20 text-center">
        <div className="text-xs text-zinc-400 uppercase tracking-widest mb-2">취향 일치도</div>
        <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {result.overall}%
        </div>
        <p className="text-sm text-zinc-400 mt-2">
          {result.overall >= 70
            ? `${friendName}님과 취향이 거의 쌍둥이네요`
            : result.overall >= 40
            ? `${friendName}님과 통하는 구석이 많아요`
            : result.overall > 0
            ? `${friendName}님과는 서로 새로운 걸 알려줄 사이`
            : `${friendName}님과 완전히 다른 세계를 사네요`}
        </p>
      </div>

      <AxisCard axisKey="music" axis={result.music} friendName={friendName} />
      <AxisCard axisKey="games" axis={result.games} friendName={friendName} />
      <AxisCard axisKey="movies" axis={result.movies} friendName={friendName} />
    </div>
  );
}
