import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getTopTracks, getArtists } from '@/lib/api/spotify';
import { getTrackListeners } from '@/lib/api/lastfm';

// 캐시 유효 시간: 24시간
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Last.fm listeners 수 → 점수 (0~100, 낮을수록 희귀)
function lastfmScore(listeners: number | null): number | null {
  if (listeners === null) return null;
  if (listeners < 5000) return 95;
  if (listeners < 20000) return 80;
  if (listeners < 100000) return 60;
  if (listeners < 500000) return 40;
  if (listeners < 2000000) return 20;
  return 5;
}

// Spotify followers 수 → 점수 (0~100, 낮을수록 희귀)
function followersScore(followers: number): number {
  if (followers < 10000) return 95;
  if (followers < 50000) return 80;
  if (followers < 200000) return 65;
  if (followers < 1000000) return 45;
  if (followers < 5000000) return 25;
  return 10;
}

// 희귀도 점수 → 등급
function getRarityGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 85) return { grade: 'SS', label: '전설급', color: '#FFD700' };
  if (score >= 70) return { grade: 'S', label: '매우 희귀', color: '#C084FC' };
  if (score >= 50) return { grade: 'A', label: '희귀', color: '#60A5FA' };
  if (score >= 30) return { grade: 'B', label: '보통', color: '#34D399' };
  return { grade: 'C', label: '대중적', color: '#9CA3AF' };
}

interface TrackRarity {
  id: string;
  name: string;
  artist: string;
  image: string | null;
  url: string;
  lastfmListeners: number | null;
  artistFollowers: number;
  rarityScore: number;
  grade: string;
  label: string;
  color: string;
}

export async function GET() {
  try {
    const token = await getValidSpotifyToken();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const cacheKey = 'spotify_rarity';

    // 캐시 확인
    const { data: cache } = await admin
      .from('taste_cache')
      .select('data, fetched_at')
      .eq('user_id', token.userId)
      .eq('platform', 'spotify')
      .eq('data_type', cacheKey)
      .maybeSingle();

    if (cache && Date.now() - new Date(cache.fetched_at).getTime() < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }

    // short_term Top Tracks 가져오기
    const tracksData = await getTopTracks(token.accessToken, 'short_term', 50);
    const rawTracks = tracksData.items || [];

    if (rawTracks.length === 0) {
      return NextResponse.json({ tracks: [], averageScore: 0, summary: null });
    }

    // 아티스트 ID 추출 (중복 제거)
    const artistIds = [...new Set(
      rawTracks.map((t: { artists: { id: string }[] }) => t.artists[0]?.id).filter(Boolean)
    )] as string[];

    // Spotify 아티스트 followers 조회 (50명씩 배치)
    const artistFollowersMap: Record<string, number> = {};
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i + 50);
      const artistsData = await getArtists(token.accessToken, batch);
      for (const a of artistsData.artists || []) {
        artistFollowersMap[a.id] = a.followers?.total || 0;
      }
    }

    // Last.fm listeners 조회 (5개씩 배치)
    const BATCH_SIZE = 5;
    const trackResults: TrackRarity[] = [];

    for (let i = 0; i < rawTracks.length; i += BATCH_SIZE) {
      const batch = rawTracks.slice(i, i + BATCH_SIZE);
      const listenerResults = await Promise.allSettled(
        batch.map((t: { name: string; artists: { name: string }[] }) =>
          getTrackListeners(t.artists[0]?.name || '', t.name)
        )
      );

      for (let j = 0; j < batch.length; j++) {
        const t = batch[j];
        const lr = listenerResults[j];
        const listeners = lr.status === 'fulfilled' ? lr.value : null;

        const primaryArtistId = t.artists[0]?.id;
        const followers = primaryArtistId ? (artistFollowersMap[primaryArtistId] || 0) : 0;

        // 희귀도 점수 계산: Last.fm 30% + Spotify followers 70%
        const lfScore = lastfmScore(listeners);
        const fScore = followersScore(followers);

        let rarityScore: number;
        if (lfScore !== null) {
          rarityScore = Math.round(lfScore * 0.3 + fScore * 0.7);
        } else {
          // Last.fm 데이터 없으면 followers만으로 계산
          rarityScore = fScore;
        }

        const { grade, label, color } = getRarityGrade(rarityScore);

        trackResults.push({
          id: t.id,
          name: t.name,
          artist: t.artists.map((a: { name: string }) => a.name).join(', '),
          image: t.album?.images?.[0]?.url || null,
          url: t.external_urls?.spotify || '',
          lastfmListeners: listeners,
          artistFollowers: followers,
          rarityScore,
          grade,
          label,
          color,
        });
      }
    }

    // 희귀도 높은 순으로 정렬
    trackResults.sort((a, b) => b.rarityScore - a.rarityScore);

    const averageScore = Math.round(
      trackResults.reduce((sum, t) => sum + t.rarityScore, 0) / trackResults.length
    );
    const { grade: avgGrade, label: avgLabel, color: avgColor } = getRarityGrade(averageScore);

    const result = {
      tracks: trackResults,
      averageScore,
      summary: { grade: avgGrade, label: avgLabel, color: avgColor },
      gradeDistribution: {
        SS: trackResults.filter(t => t.grade === 'SS').length,
        S: trackResults.filter(t => t.grade === 'S').length,
        A: trackResults.filter(t => t.grade === 'A').length,
        B: trackResults.filter(t => t.grade === 'B').length,
        C: trackResults.filter(t => t.grade === 'C').length,
      },
    };

    // 캐시 저장
    await admin.from('taste_cache').upsert({
      user_id: token.userId,
      platform: 'spotify',
      data_type: cacheKey,
      data: result,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,data_type' });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to analyze rarity' }, { status: 500 });
  }
}
