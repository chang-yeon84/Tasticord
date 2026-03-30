'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gamepad2, Clock, Trophy, Loader2, Music, Film, ShieldAlert, Mic2, Disc3, History } from 'lucide-react';

// Steam 게임 헤더 이미지 URL (header.jpg 없으면 capsule_231x87.jpg로 대체)
function getSteamHeaderUrl(appId: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

// 이미지 로드 실패 시 fallback 체인: header.jpg → capsule → Store API → 텍스트
function handleImgError(e: React.SyntheticEvent<HTMLImageElement>, appId: number) {
  const img = e.currentTarget;
  const capsuleFallback = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`;
  const storeFallback = `/api/steam/image?appid=${appId}`;

  if (img.src.includes('/api/steam/image')) {
    // Store API도 실패 → 텍스트 표시
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.img-fallback')) {
      const fallbackDiv = document.createElement('div');
      fallbackDiv.className = 'img-fallback absolute inset-0 bg-zinc-800 flex items-center justify-center p-2';
      fallbackDiv.innerHTML = `<span class="text-xs text-zinc-400 text-center font-medium">${img.alt}</span>`;
      parent.style.position = 'relative';
      parent.appendChild(fallbackDiv);
    }
  } else if (img.src === capsuleFallback) {
    // capsule도 실패 → Store API로
    img.src = storeFallback;
  } else {
    // header 실패 → capsule로
    img.src = capsuleFallback;
  }
}

// 플레이타임(분)을 읽기 쉽게 변환
function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours.toLocaleString()}시간`;
  return `${minutes}분`;
}

interface SteamGame {
  appid: number;
  name: string;
  playtime_minutes: number;
  icon: string;
}

interface RecentGame {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  img_icon_url: string;
}

interface GenreStat {
  name: string;
  playtime: number;
  count: number;
}

// 장르별 색상
const GENRE_COLORS: Record<string, string> = {
  'Action': 'bg-red-500',
  '액션': 'bg-red-500',
  'Adventure': 'bg-emerald-500',
  '어드벤처': 'bg-emerald-500',
  'RPG': 'bg-purple-500',
  'Strategy': 'bg-blue-500',
  '전략': 'bg-blue-500',
  'Simulation': 'bg-cyan-500',
  '시뮬레이션': 'bg-cyan-500',
  'Sports': 'bg-orange-500',
  '스포츠': 'bg-orange-500',
  'Racing': 'bg-yellow-500',
  '레이싱': 'bg-yellow-500',
  'Indie': 'bg-pink-500',
  '인디': 'bg-pink-500',
  'Casual': 'bg-lime-500',
  '캐주얼': 'bg-lime-500',
  'Free to Play': 'bg-teal-500',
  '무료 플레이': 'bg-teal-500',
  'Massively Multiplayer': 'bg-violet-500',
  'Early Access': 'bg-amber-500',
  '앞서 해보기': 'bg-amber-500',
};

interface Achievement {
  gameName: string;
  appid: number;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
  globalPercent: number | null;
}

interface CurrentlyPlaying {
  isPlaying: boolean;
  gameName: string | null;
  gameId: string | null;
  personaState: number;
  profileName: string;
  avatarUrl: string;
  isProfilePublic: boolean;
}

// Spotify 관련 타입
interface SpotifyArtistItem {
  id: string;
  name: string;
  image: string | null;
  genres: string[];
  url: string;
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string | null;
  duration_ms: number;
  url: string;
}

interface SpotifyRecentItem extends SpotifyTrackItem {
  played_at: string;
}

interface SpotifyNowPlaying {
  is_playing: boolean;
  item: {
    name: string;
    artists: { name: string }[];
    album: { name: string; images: { url: string }[] };
    external_urls: { spotify: string };
  } | null;
}

// 곡 재생시간 포맷
function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// 상대 시간 포맷
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function MyTastePage() {
  const [ownedGames, setOwnedGames] = useState<SteamGame[]>([]);
  const [gameCount, setGameCount] = useState(0);
  const [playedCount, setPlayedCount] = useState(0);
  const [totalPlaytime, setTotalPlaytime] = useState(0);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [genres, setGenres] = useState<GenreStat[]>([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<CurrentlyPlaying | null>(null);
  const [steamConnected, setSteamConnected] = useState<boolean | null>(null);
  const [steamProfilePublic, setSteamProfilePublic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'music' | 'movie'>('game');

  // Spotify 관련 state
  const [spotifyConnected, setSpotifyConnected] = useState<boolean | null>(null);
  const [musicLoading, setMusicLoading] = useState(true);
  const [nowPlaying, setNowPlaying] = useState<SpotifyNowPlaying | null>(null);
  const [topArtists, setTopArtists] = useState<SpotifyArtistItem[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrackItem[]>([]);
  const [recentTracks, setRecentTracks] = useState<SpotifyRecentItem[]>([]);
  const [artistTimeRange, setArtistTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [trackTimeRange, setTrackTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Steam 연동 여부 확인
      const { data: connection } = await supabase
        .from('platform_connections')
        .select('platform_user_id')
        .eq('user_id', user.id)
        .eq('platform', 'steam')
        .single();

      if (!connection) {
        setSteamConnected(false);
        setLoading(false);
        return;
      }

      setSteamConnected(true);

      // taste_cache에서 보유 게임 데이터 가져오기
      const { data: cache } = await supabase
        .from('taste_cache')
        .select('data')
        .eq('user_id', user.id)
        .eq('platform', 'steam')
        .eq('data_type', 'owned_games')
        .maybeSingle();

      if (cache?.data) {
        setOwnedGames(cache.data.games || []);
        setGameCount(cache.data.game_count || 0);
        setPlayedCount(cache.data.played_count || 0);
        setTotalPlaytime(cache.data.total_playtime || 0);
      } else {
        // 캐시가 없으면 API로 가져오기
        try {
          const res = await fetch('/api/steam/games');
          if (res.ok) {
            const data = await res.json();
            setGameCount(data.game_count || 0);
            setPlayedCount(data.played_count || 0);
            setTotalPlaytime(data.total_playtime || 0);
            setOwnedGames(data.games || []);
          }
        } catch {
          console.error('Failed to fetch Steam games');
        }
      }

      // 최근 2주간 플레이한 게임
      try {
        const res = await fetch('/api/steam/recent');
        if (res.ok) {
          const data = await res.json();
          setRecentGames(
            (data?.response?.games || [])
              .sort((a: RecentGame, b: RecentGame) => b.playtime_2weeks - a.playtime_2weeks)
          );
        }
      } catch {
        console.error('Failed to fetch recent games');
      }

      // 현재 플레이 중인 게임 + 프로필 공개 여부
      try {
        const res = await fetch('/api/steam/currently-playing');
        if (res.ok) {
          const data = await res.json();
          setCurrentlyPlaying(data);
          setSteamProfilePublic(data?.isProfilePublic ?? null);
        }
      } catch {
        console.error('Failed to fetch currently playing');
      }

      setLoading(false);

      // 장르 + 도전과제 (메인 로딩 후 별도로 가져오기)
      setGenresLoading(true);
      setAchievementsLoading(true);

      // 병렬로 가져오기
      const [genresRes, achievementsRes] = await Promise.allSettled([
        fetch('/api/steam/genres'),
        fetch('/api/steam/achievements'),
      ]);

      if (genresRes.status === 'fulfilled' && genresRes.value.ok) {
        const data = await genresRes.value.json();
        setGenres(data.genres || []);
      }
      setGenresLoading(false);

      if (achievementsRes.status === 'fulfilled' && achievementsRes.value.ok) {
        const data = await achievementsRes.value.json();
        setAchievements(data.achievements || []);
      }
      setAchievementsLoading(false);
    }

    fetchData();
  }, []);

  // Spotify 데이터 가져오기
  useEffect(() => {
    async function fetchSpotifyData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connection } = await supabase
        .from('platform_connections')
        .select('platform_user_id')
        .eq('user_id', user.id)
        .eq('platform', 'spotify')
        .single();

      if (!connection) {
        setSpotifyConnected(false);
        setMusicLoading(false);
        return;
      }

      setSpotifyConnected(true);

      // 현재 재생 중 + Top 아티스트 + Top 트랙 + 최근 재생 병렬 호출
      const [nowRes, artistsRes, tracksRes, recentRes] = await Promise.allSettled([
        fetch('/api/spotify/now-playing'),
        fetch('/api/spotify/top-artists?time_range=medium_term'),
        fetch('/api/spotify/top-tracks?time_range=medium_term'),
        fetch('/api/spotify/recent'),
      ]);

      if (nowRes.status === 'fulfilled' && nowRes.value.ok) {
        try {
          const data = await nowRes.value.json();
          setNowPlaying(data);
        } catch { /* 재생 중 아닐 수 있음 */ }
      }

      if (artistsRes.status === 'fulfilled' && artistsRes.value.ok) {
        const data = await artistsRes.value.json();
        setTopArtists(data.artists || []);
      }

      if (tracksRes.status === 'fulfilled' && tracksRes.value.ok) {
        const data = await tracksRes.value.json();
        setTopTracks(data.tracks || []);
      }

      if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
        const data = await recentRes.value.json();
        setRecentTracks(data.tracks || []);
      }

      setMusicLoading(false);
    }

    fetchSpotifyData();
  }, []);

  // 아티스트 기간 변경
  useEffect(() => {
    if (!spotifyConnected) return;
    setArtistsLoading(true);
    fetch(`/api/spotify/top-artists?time_range=${artistTimeRange}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setTopArtists(data.artists || []); })
      .finally(() => setArtistsLoading(false));
  }, [artistTimeRange, spotifyConnected]);

  // 트랙 기간 변경
  useEffect(() => {
    if (!spotifyConnected) return;
    setTracksLoading(true);
    fetch(`/api/spotify/top-tracks?time_range=${trackTimeRange}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setTopTracks(data.tracks || []); })
      .finally(() => setTracksLoading(false));
  }, [trackTimeRange, spotifyConnected]);

  const TIME_RANGE_LABELS: Record<string, string> = {
    short_term: '4주',
    medium_term: '6개월',
    long_term: '전체',
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-6">내 취향</h2>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-8">
        {([
          { key: 'game', label: '게임', icon: Gamepad2 },
          { key: 'music', label: '음악', icon: Music },
          { key: 'movie', label: '영화/드라마', icon: Film },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === key
                ? 'bg-white text-black'
                : 'bg-zinc-900/50 border border-zinc-800/35 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 게임 탭 */}
      {activeTab === 'game' && (
      <div className="mb-10">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : !steamConnected ? (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800/35 rounded-2xl">
            <Gamepad2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">Steam이 연동되지 않았습니다</p>
            <a
              href="/api/auth/steam"
              className="inline-block mt-4 px-6 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
            >
              Steam 연동하기
            </a>
          </div>
        ) : steamProfilePublic === false ? (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800/35 rounded-2xl">
            <ShieldAlert className="w-10 h-10 text-yellow-500/70 mx-auto mb-3" />
            <p className="text-zinc-300 font-medium">Steam 프로필이 비공개 상태입니다</p>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
              게임 정보를 불러오려면 Steam 프로필 공개 설정을 <span className="text-zinc-300">공개</span>로 변경해주세요
            </p>
            <a
              href="https://steamcommunity.com/my/edit/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-5 px-6 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
            >
              Steam 설정으로 이동 ↗
            </a>
          </div>
        ) : (
          <>
            {/* 현재 플레이 중 */}
            {currentlyPlaying?.isPlaying && (
              <div className="mb-6 bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-800/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider">현재 플레이 중</span>
                </div>
                <div className="flex items-center gap-4">
                  {currentlyPlaying.gameId && (
                    <img
                      src={getSteamHeaderUrl(Number(currentlyPlaying.gameId))}
                      alt={currentlyPlaying.gameName || ''}
                      className="w-40 h-[75px] rounded-lg object-cover"
                      onError={(e) => handleImgError(e, Number(currentlyPlaying.gameId))}
                    />
                  )}
                  <div>
                    <p className="text-lg font-bold">{currentlyPlaying.gameName}</p>
                    <a
                      href={`https://store.steampowered.com/app/${currentlyPlaying.gameId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-white transition"
                    >
                      Steam에서 보기 ↗
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 text-center">
                <Gamepad2 className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                <div className="text-xl font-bold">{gameCount}</div>
                <div className="text-xs text-zinc-500">보유 게임</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                <div className="text-xl font-bold">{formatMinutes(totalPlaytime)}</div>
                <div className="text-xs text-zinc-500">총 플레이타임</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 text-center">
                <Trophy className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                <div className="text-xl font-bold">
                  {formatMinutes(recentGames.reduce((sum, g) => sum + g.playtime_2weeks, 0))}
                </div>
                <div className="text-xs text-zinc-500">최근 2주 플레이</div>
              </div>
            </div>

            {/* 요즘 많이 플레이한 장르 */}
            {genresLoading ? (
              <div className="mb-8">
                <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin mr-2" />
                  <span className="text-sm text-zinc-500">장르 분석 중...</span>
                </div>
              </div>
            ) : genres.length > 0 && (
              <div className="mb-8">
                <p className="text-sm text-zinc-400 mb-3">요즘 이런 장르를 많이 플레이했어요</p>
                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 5).map((genre) => {
                    const colorClass = GENRE_COLORS[genre.name] || 'bg-zinc-500';
                    return (
                      <span
                        key={genre.name}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800/35 rounded-full"
                      >
                        <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                        <span className="text-sm font-medium">{genre.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 최근 달성한 도전과제 */}
            {achievementsLoading ? (
              <div className="mb-8">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">최근 달성한 도전과제 <span className="text-zinc-600 normal-case font-normal">(🌍 전체 플레이어 대비 비율)</span></h4>
                <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin mr-2" />
                  <span className="text-sm text-zinc-500">도전과제 불러오는 중...</span>
                </div>
              </div>
            ) : achievements.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">최근 달성한 도전과제 <span className="text-zinc-600 normal-case font-normal">(🌍 전체 플레이어 대비 비율)</span></h4>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  {achievements.map((ach, idx) => (
                    <div
                      key={`${ach.appid}-${ach.name}-${idx}`}
                      className="flex-shrink-0 w-[140px] bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-3 flex flex-col items-center text-center"
                    >
                      {ach.icon ? (
                        <img
                          src={ach.icon}
                          alt={ach.name}
                          className="w-12 h-12 rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg mb-2 bg-zinc-800 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-zinc-600" />
                        </div>
                      )}
                      <p className="text-xs font-semibold truncate w-full">{ach.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate w-full mt-0.5">{ach.gameName}</p>
                      {ach.globalPercent != null && (
                        <p className={`text-[10px] font-medium mt-1 ${Number(ach.globalPercent) < 10 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                          {Number(ach.globalPercent).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 최근에 많이 플레이한 게임 */}
            {recentGames.length > 0 && (
              <>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">최근에 많이 플레이한 게임</h4>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {recentGames.slice(0, 3).map((game) => (
                    <a
                      key={game.appid}
                      href={`https://store.steampowered.com/app/${game.appid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="relative rounded-xl overflow-hidden">
                        <img
                          src={getSteamHeaderUrl(game.appid)}
                          alt={game.name}
                          className="w-full aspect-[16/9] object-cover bg-zinc-800 group-hover:scale-105 transition duration-300"
                          onError={(e) => handleImgError(e, game.appid)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <p className="text-xs font-semibold truncate">{game.name}</p>
                          <p className="text-[10px] text-purple-400 font-medium mt-0.5">
                            최근 {formatMinutes(game.playtime_2weeks)}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* 게임 목록 (플레이타임 순) */}
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">전체 플레이타임 순</h4>
            {(() => {
              const playedGames = ownedGames.filter(g => g.playtime_minutes > 0);
              const visibleGames = showAll ? playedGames : playedGames.slice(0, 10);
              const hasMore = playedGames.length > 10;

              return (
                <div className="space-y-2">
                  {visibleGames.map((game, idx) => (
                    <a
                      key={game.appid}
                      href={`https://store.steampowered.com/app/${game.appid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-3 flex items-center gap-4 hover:bg-zinc-800/50 transition group"
                    >
                      {/* 순위 */}
                      <span className={`text-sm font-bold w-6 text-center ${idx < 3 ? 'text-yellow-400' : 'text-zinc-600'}`}>
                        {idx + 1}
                      </span>

                      {/* 게임 이미지 */}
                      <img
                        src={getSteamHeaderUrl(game.appid)}
                        alt={game.name}
                        className="w-[120px] h-[45px] rounded-lg object-cover flex-shrink-0 bg-zinc-800"
                        onError={(e) => handleImgError(e, game.appid)}
                      />

                      {/* 게임 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-white transition">
                          {game.name}
                        </p>
                      </div>

                      {/* 플레이타임 */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-semibold text-zinc-300">
                          {formatMinutes(game.playtime_minutes)}
                        </span>
                      </div>
                    </a>
                  ))}

                  {/* 더보기 / 접기 버튼 */}
                  {hasMore && (
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-300 transition border border-zinc-800/35 rounded-xl hover:bg-zinc-800/30"
                    >
                      {showAll ? '접기' : `더보기 (${playedGames.length - 10}개)`}
                    </button>
                  )}

                  {/* 미플레이 게임 */}
                  {ownedGames.filter(g => g.playtime_minutes === 0).length > 0 && (
                    <div className="text-center py-4 text-xs text-zinc-600">
                      + 미플레이 게임 {ownedGames.filter(g => g.playtime_minutes === 0).length}개
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
      )}

      {/* 음악 탭 */}
      {/* 음악 탭 */}
      {activeTab === 'music' && (
      <div className="mb-10">
        {musicLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : !spotifyConnected ? (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800/35 rounded-2xl">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">Spotify가 연동되지 않았습니다</p>
            <a
              href="/api/auth/spotify"
              className="inline-block mt-4 px-6 py-2 text-sm bg-green-600 hover:bg-green-500 rounded-lg transition"
            >
              Spotify 연동하기
            </a>
          </div>
        ) : (
          <>
            {/* 현재 재생 중 */}
            {nowPlaying?.is_playing && nowPlaying.item && (
              <div className="mb-6 bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-800/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider">현재 재생 중</span>
                </div>
                <div className="flex items-center gap-4">
                  {nowPlaying.item.album.images?.[0]?.url && (
                    <img
                      src={nowPlaying.item.album.images[0].url}
                      alt={nowPlaying.item.album.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-lg font-bold truncate">{nowPlaying.item.name}</p>
                    <p className="text-sm text-zinc-400 truncate">
                      {nowPlaying.item.artists.map(a => a.name).join(', ')}
                    </p>
                    <a
                      href={nowPlaying.item.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-green-400 transition"
                    >
                      Spotify에서 듣기 ↗
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 text-center">
                <Mic2 className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                <div className="text-xl font-bold">{topArtists.length}</div>
                <div className="text-xs text-zinc-500">Top 아티스트</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 text-center">
                <Disc3 className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                <div className="text-xl font-bold">{topTracks.length}</div>
                <div className="text-xs text-zinc-500">Top 트랙</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 text-center">
                <History className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                <div className="text-xl font-bold">{recentTracks.length}</div>
                <div className="text-xs text-zinc-500">최근 재생</div>
              </div>
            </div>

            {/* 장르 태그 (Top 아티스트의 장르에서 추출) */}
            {(() => {
              const genreCount: Record<string, number> = {};
              topArtists.forEach(a => a.genres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; }));
              const topGenres = Object.entries(genreCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([name]) => name);
              if (topGenres.length === 0) return null;
              return (
                <div className="mb-8">
                  <p className="text-sm text-zinc-400 mb-3">요즘 이런 장르를 많이 들었어요</p>
                  <div className="flex flex-wrap gap-2">
                    {topGenres.map(genre => (
                      <span
                        key={genre}
                        className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/35 rounded-full text-sm font-medium capitalize"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Top 아티스트 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Top 아티스트</h4>
                <div className="flex gap-1">
                  {(['short_term', 'medium_term', 'long_term'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setArtistTimeRange(range)}
                      className={`px-3 py-1 text-xs rounded-full transition ${
                        artistTimeRange === range
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {TIME_RANGE_LABELS[range]}
                    </button>
                  ))}
                </div>
              </div>
              {artistsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              ) : topArtists.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {topArtists.slice(0, 8).map((artist, idx) => (
                    <a
                      key={artist.id}
                      href={artist.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group text-center"
                    >
                      <div className="relative mb-2">
                        {artist.image ? (
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="w-full aspect-square rounded-full object-cover bg-zinc-800 group-hover:ring-2 ring-green-500 transition"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded-full bg-zinc-800 flex items-center justify-center">
                            <Mic2 className="w-8 h-8 text-zinc-600" />
                          </div>
                        )}
                        {idx < 3 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-600 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium truncate group-hover:text-green-400 transition">
                        {artist.name}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 text-center py-6">데이터가 아직 없습니다</p>
              )}
            </div>

            {/* Top 트랙 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Top 트랙</h4>
                <div className="flex gap-1">
                  {(['short_term', 'medium_term', 'long_term'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setTrackTimeRange(range)}
                      className={`px-3 py-1 text-xs rounded-full transition ${
                        trackTimeRange === range
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {TIME_RANGE_LABELS[range]}
                    </button>
                  ))}
                </div>
              </div>
              {tracksLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {topTracks.slice(0, 10).map((track, idx) => (
                    <a
                      key={track.id}
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-3 flex items-center gap-4 hover:bg-zinc-800/50 transition group"
                    >
                      <span className={`text-sm font-bold w-6 text-center ${idx < 3 ? 'text-green-400' : 'text-zinc-600'}`}>
                        {idx + 1}
                      </span>
                      {track.image && (
                        <img
                          src={track.image}
                          alt={track.album}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-zinc-800"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-green-400 transition">
                          {track.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                      </div>
                      <span className="text-xs text-zinc-600 flex-shrink-0">
                        {formatDuration(track.duration_ms)}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 재생 기록 */}
            {recentTracks.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">최근 재생 기록</h4>
                <div className="space-y-1">
                  {recentTracks.slice(0, 10).map((track, idx) => (
                    <a
                      key={`${track.id}-${idx}`}
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-900/50 transition group"
                    >
                      {track.image && (
                        <img
                          src={track.image}
                          alt={track.album}
                          className="w-8 h-8 rounded object-cover flex-shrink-0 bg-zinc-800"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate group-hover:text-green-400 transition">{track.name}</p>
                        <p className="text-xs text-zinc-600 truncate">{track.artist}</p>
                      </div>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0">
                        {timeAgo(track.played_at)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      )}

      {/* 영화/드라마 탭 */}
      {activeTab === 'movie' && (
        <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800/35 rounded-2xl">
          <Film className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">영화/드라마 취향 분석이 곧 추가될 예정이에요</p>
          <p className="text-xs text-zinc-600 mt-2">Netflix 연동 후 이용 가능</p>
        </div>
      )}
    </div>
  );
}
