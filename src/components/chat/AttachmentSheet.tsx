'use client';

import { useState, useEffect } from 'react';
import { Music, Gamepad2, Film, Search, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { EmbedType } from '@/types';

/**
 * 채팅 첨부 바텀 시트 컴포넌트
 *
 * 플로우:
 * 1. 사용자가 + 버튼 클릭 → 이 시트가 열림
 * 2. 음악 / 게임 / 영화 탭 전환
 * 3. 각 탭 진입 시 해당 데이터 로드 (lazy fetch)
 * 4. 검색창으로 필터링 가능
 * 5. 아이템 클릭 → onSelect 콜백 호출 후 시트 닫기
 *
 * 애니메이션:
 * - translate-y로 아래→위 슬라이드
 * - 배경 딤(dim) 영역 클릭 시 닫기
 */

// 각 타입별 아이템 인터페이스
interface MusicItem {
  id: string;
  title: string;
  artist: string;
  image_url: string | null;
  url: string;
}

interface GameItem {
  appid: number;
  title: string;
  image_url: string;
  url: string;
}

interface MovieItem {
  title: string;
  image_url: string | null;
  url: string;
}

// 부모에게 전달할 embed 데이터 타입
type EmbedPayload = {
  music: { title: string; artist: string; image_url: string | null; spotify_id: string; url: string };
  game: { title: string; image_url: string; steam_app_id: number; url: string };
  movie: { title: string; image_url: string | null; url: string };
};

interface AttachmentSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: <T extends EmbedType>(type: T, data: EmbedPayload[NonNullable<T>]) => void;
}

type Tab = 'music' | 'game' | 'movie';

export default function AttachmentSheet({ open, onClose, onSelect }: AttachmentSheetProps) {
  const [tab, setTab] = useState<Tab>('music');
  const [search, setSearch] = useState('');

  // 각 탭 데이터 + 로딩 상태
  const [musicList, setMusicList] = useState<MusicItem[] | null>(null);
  const [gameList, setGameList] = useState<GameItem[] | null>(null);
  const [movieList, setMovieList] = useState<MovieItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  // 시트가 열릴 때마다 검색어 초기화
  useEffect(() => {
    if (open) setSearch('');
  }, [open, tab]);

  // 탭 진입 시 해당 데이터 lazy fetch
  useEffect(() => {
    if (!open) return;

    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (tab === 'music' && !musicList) {
        setLoading(true);
        try {
          const res = await fetch('/api/spotify/top-tracks?time_range=short_term');
          if (res.ok) {
            const data = await res.json();
            // Spotify API 응답 → 공통 포맷으로 변환
            setMusicList(
              (data.tracks || []).map((t: { id: string; name: string; artist: string; image: string | null; url: string }) => ({
                id: t.id,
                title: t.name,
                artist: t.artist,
                image_url: t.image,
                url: t.url,
              }))
            );
          } else {
            setMusicList([]);
          }
        } catch {
          setMusicList([]);
        }
        setLoading(false);
      }

      if (tab === 'game' && !gameList) {
        setLoading(true);
        try {
          // 최근 플레이 게임 + 보유 게임 병렬 로드
          const [recentRes, cacheRes] = await Promise.all([
            fetch('/api/steam/recent'),
            supabase
              .from('taste_cache')
              .select('data')
              .eq('user_id', user.id)
              .eq('platform', 'steam')
              .eq('data_type', 'owned_games')
              .maybeSingle(),
          ]);

          // 최근 2주 플레이 게임 (playtime_2weeks 순)
          let recentGames: Array<{ appid: number; name: string; playtime_2weeks: number }> = [];
          if (recentRes.ok) {
            const data = await recentRes.json();
            recentGames = (data?.response?.games || [])
              .sort((a: { playtime_2weeks: number }, b: { playtime_2weeks: number }) => b.playtime_2weeks - a.playtime_2weeks);
          }

          // 보유 게임 전체 (plaxytime_minutes 순)
          let ownedGames = (cacheRes.data?.data?.games || []) as Array<{ appid: number; name: string; playtime_minutes: number }>;
          if (ownedGames.length === 0) {
            const res = await fetch('/api/steam/games');
            if (res.ok) {
              const data = await res.json();
              ownedGames = data.games || [];
            }
          }
          ownedGames = ownedGames.sort((a, b) => b.playtime_minutes - a.playtime_minutes);

          // 최근 게임을 먼저, 중복 제외하고 나머지 보유 게임 추가
          const recentAppIds = new Set(recentGames.map(g => g.appid));
          const merged = [
            ...recentGames.map(g => ({ appid: g.appid, name: g.name })),
            ...ownedGames.filter(g => !recentAppIds.has(g.appid)).map(g => ({ appid: g.appid, name: g.name })),
          ];

          setGameList(
            merged.map(g => ({
              appid: g.appid,
              title: g.name,
              image_url: `/api/steam/image?appid=${g.appid}`,
              url: `https://store.steampowered.com/app/${g.appid}`,
            }))
          );
        } catch {
          setGameList([]);
        }
        setLoading(false);
      }

      if (tab === 'movie' && !movieList) {
        setLoading(true);
        try {
          // API 사용 (RLS 우회 + 일관성)
          const res = await fetch('/api/netflix/history');
          if (res.ok) {
            const data = await res.json();
            const history = (data.history || []) as Array<{ title: string; poster_url: string | null }>;
            setMovieList(
              history.map(m => ({
                title: m.title,
                image_url: m.poster_url,
                url: `https://www.netflix.com/search?q=${encodeURIComponent(m.title)}`,
              }))
            );
          } else {
            setMovieList([]);
          }
        } catch {
          setMovieList([]);
        }
        setLoading(false);
      }
    }

    loadData();
  }, [open, tab, musicList, gameList, movieList]);

  // 검색 필터링
  const filterBySearch = <T extends { title: string }>(list: T[] | null): T[] => {
    if (!list) return [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(item => item.title.toLowerCase().includes(q));
  };

  // 아이템 선택 핸들러
  const handleSelect = (item: MusicItem | GameItem | MovieItem) => {
    if (tab === 'music') {
      const m = item as MusicItem;
      onSelect('music', {
        title: m.title,
        artist: m.artist,
        image_url: m.image_url,
        spotify_id: m.id,
        url: m.url,
      });
    } else if (tab === 'game') {
      const g = item as GameItem;
      onSelect('game', {
        title: g.title,
        image_url: g.image_url,
        steam_app_id: g.appid,
        url: g.url,
      });
    } else {
      const mv = item as MovieItem;
      onSelect('movie', {
        title: mv.title,
        image_url: mv.image_url,
        url: mv.url,
      });
    }
    onClose();
  };

  if (!open) return null;

  const tabs: Array<{ key: Tab; label: string; icon: typeof Music }> = [
    { key: 'music', label: '음악', icon: Music },
    { key: 'game', label: '게임', icon: Gamepad2 },
    { key: 'movie', label: '영화', icon: Film },
  ];

  // 현재 탭의 필터링된 리스트
  const currentList =
    tab === 'music'
      ? filterBySearch(musicList)
      : tab === 'game'
      ? filterBySearch(gameList)
      : filterBySearch(movieList);

  return (
    <>
      {/* 배경 딤 - 클릭 시 닫기 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
      />

      {/* 바텀 시트 본체 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
          <h3 className="font-semibold">추천 카드 보내기</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 바 */}
        <div className="flex gap-1 px-3 py-2 border-b border-zinc-800/50">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                tab === key
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <div className="px-4 py-3 border-b border-zinc-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-2 text-sm placeholder-zinc-600 outline-none focus:border-zinc-600 transition"
            />
          </div>
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              {search ? '검색 결과가 없습니다' : '데이터가 없습니다'}
            </div>
          ) : (
            <div className="space-y-1">
              {currentList.map((item, idx) => {
                const key = 'id' in item ? item.id : 'appid' in item ? item.appid : `${item.title}-${idx}`;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800/50 transition text-left"
                  >
                    {/* 썸네일 40x40 */}
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[10px] text-zinc-500">?</span>
                        </div>
                      )}
                    </div>
                    {/* 제목 + 부제목 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      {'artist' in item && (
                        <p className="text-xs text-zinc-500 truncate">{item.artist}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
