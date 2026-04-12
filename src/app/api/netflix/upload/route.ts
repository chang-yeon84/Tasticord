import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── CSV 파싱 헬퍼 ─────────────────────────────────────────────

/**
 * CSV 텍스트를 파싱해서 { title, date } 배열로 변환
 * - 첫 줄은 헤더(Title, Date)이므로 스킵
 * - 쉼표로 분리하되, 따옴표로 감싸진 경우 처리
 */
function parseCsv(text: string): Array<{ title: string; date: string }> {
  const lines = text.split('\n').filter(line => line.trim());

  // 첫 줄(헤더) 제거
  lines.shift();

  return lines.map(line => {
    // 따옴표로 감싸진 필드 처리: "제목, 부제",2024-01-01
    const match = line.match(/^"(.+?)"\s*,\s*(.+)$/) || line.match(/^(.+?)\s*,\s*(.+)$/);
    if (!match) return null;

    const title = match[1].trim();
    let date = match[2].trim().replace(/"/g, '');

    // 넷플릭스 날짜 형식 변환: M/D/YY → YYYY-MM-DD
    const mdyMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (mdyMatch) {
      const month = mdyMatch[1].padStart(2, '0');
      const day = mdyMatch[2].padStart(2, '0');
      let year = mdyMatch[3];
      if (year.length === 2) year = `20${year}`;
      date = `${year}-${month}-${day}`;
    }

    return { title, date };
  }).filter(Boolean) as Array<{ title: string; date: string }>;
}

/**
 * 넷플릭스 제목에서 순수 작품명만 추출
 * - "브레이킹 배드: 시즌 3: 문" → "브레이킹 배드"
 * - "중독의 비즈니스: 리미티드 시리즈: 코카인" → "중독의 비즈니스"
 * - "펄프 픽션" → "펄프 픽션" (변경 없음)
 *
 * 패턴: ": 시즌 N" 또는 ": 리미티드 시리즈" 앞부분만 추출
 */
function extractPureTitle(rawTitle: string): string {
  // 콜론(:)이 있으면 첫 번째 콜론 앞부분이 순수 작품명
  // - "브레이킹 배드: 시즌 3: 문" → "브레이킹 배드"
  // - "오징어 게임: 무궁화 꽃이 피었습니다" → "오징어 게임"
  // - "더 글로리: 에피소드 3" → "더 글로리"
  // - "펄프 픽션" → "펄프 픽션" (콜론 없으면 원본)
  const colonIndex = rawTitle.indexOf(':');
  if (colonIndex > 0) {
    return rawTitle.substring(0, colonIndex).trim();
  }

  return rawTitle;
}

/**
 * 파싱된 목록에서 중복 제거 + 가장 최근 날짜를 대표 날짜로 선정
 * - 동일 작품명이 여러 번 나오면 가장 최근 날짜만 남김
 */
function deduplicateByTitle(
  items: Array<{ title: string; date: string }>
): Array<{ title: string; date: string }> {
  const map = new Map<string, string>();

  for (const item of items) {
    const existing = map.get(item.title);
    // 기존 날짜보다 최근이면 교체
    if (!existing || item.date > existing) {
      map.set(item.title, item.date);
    }
  }

  return Array.from(map.entries()).map(([title, date]) => ({ title, date }));
}

// ─── TMDB API 헬퍼 ─────────────────────────────────────────────

/**
 * TMDB API로 작품을 검색해서 포스터 URL을 반환
 * - ko-KR로 먼저 검색, 결과 없으면 en-US로 재시도
 * - 검색 결과 첫 번째 항목의 poster_path 사용
 * - poster_path가 없으면 null 반환
 */
// TMDB 장르 ID → 장르명 매핑 (TMDB 공식 장르 목록)
const TMDB_GENRES: Record<number, string> = {
  28: '액션', 12: '모험', 16: '애니메이션', 35: '코미디', 80: '범죄',
  99: '다큐멘터리', 18: '드라마', 10751: '가족', 14: '판타지', 36: '역사',
  27: '공포', 10402: '음악', 9648: '미스터리', 10749: '로맨스', 878: 'SF',
  10770: 'TV 영화', 53: '스릴러', 10752: '전쟁', 37: '서부',
  // TV 장르
  10759: '액션 & 어드벤처', 10762: '키즈', 10763: '뉴스', 10764: '리얼리티',
  10765: 'SF & 판타지', 10766: '연속극', 10767: '토크', 10768: '전쟁 & 정치',
};

interface TmdbResult {
  posterUrl: string | null;
  genres: string[];
  mediaType: string | null;
}

async function fetchFromTmdb(title: string): Promise<TmdbResult> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return { posterUrl: null, genres: [], mediaType: null };

  // TMDB 검색 결과에서 포스터 + 장르 추출 헬퍼
  const extractResult = (item: Record<string, unknown>): TmdbResult | null => {
    const posterPath = item.poster_path as string | null;
    const genreIds = (item.genre_ids || []) as number[];
    const genres = genreIds.map(id => TMDB_GENRES[id]).filter(Boolean);
    const mediaType = (item.media_type as string) || null;

    if (posterPath || genres.length > 0) {
      return {
        posterUrl: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null,
        genres,
        mediaType,
      };
    }
    return null;
  };

  // 1차 시도: 한국어(ko-KR) 검색
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=ko-KR`);
    if (res.ok) {
      const data = await res.json();
      if (data.results?.length > 0) {
        const result = extractResult(data.results[0]);
        if (result) return result;
      }
    }
  } catch { /* 영문으로 재시도 */ }

  // 2차 시도: 영문(en-US) 검색
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=en-US`);
    if (res.ok) {
      const data = await res.json();
      if (data.results?.length > 0) {
        const result = extractResult(data.results[0]);
        if (result) return result;
      }
    }
  } catch { /* 실패 */ }

  return { posterUrl: null, genres: [], mediaType: null };
}

/**
 * TMDB API 호출을 5개씩 묶어서 병렬 처리 (rate limit 방지)
 * - 이미 포스터가 저장된 작품은 스킵
 * - 각 배치 사이에 대기 없이 순차적으로 처리 (5개 동시 요청은 TMDB 허용 범위)
 */
interface EnrichedItem {
  title: string;
  date: string;
  posterUrl: string | null;
  genres: string[];
  mediaType: string | null;
}

/**
 * TMDB API 호출을 5개씩 묶어서 병렬 처리 (rate limit 방지)
 * - 이미 포스터가 저장된 작품은 스킵
 * - 포스터 + 장르 + 미디어 타입을 함께 가져옴
 */
async function fetchTmdbInBatches(
  items: Array<{ title: string; date: string }>,
  existingData: Map<string, { posterUrl: string; genres: string[] }>
): Promise<EnrichedItem[]> {
  const results: EnrichedItem[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        // 이미 저장된 데이터가 있으면 TMDB 호출 스킵
        const existing = existingData.get(item.title);
        if (existing) {
          return { ...item, posterUrl: existing.posterUrl, genres: existing.genres, mediaType: null };
        }

        // TMDB에서 포스터 + 장르 가져오기
        const tmdb = await fetchFromTmdb(item.title);
        return { ...item, ...tmdb };
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  return results;
}

// ─── API 라우트 핸들러 ─────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. FormData에서 CSV 파일 추출
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'CSV 파일이 필요합니다' }, { status: 400 });
    }

    // 3. CSV 텍스트 읽기 및 파싱
    const csvText = await file.text();
    const rawItems = parseCsv(csvText);

    console.log(`[Netflix Upload] CSV 파싱 결과: ${rawItems.length}개 항목`);
    if (rawItems.length > 0) {
      console.log(`[Netflix Upload] 첫 항목: ${JSON.stringify(rawItems[0])}`);
    }

    if (rawItems.length === 0) {
      console.log(`[Netflix Upload] CSV 텍스트 첫 200자: ${csvText.substring(0, 200)}`);
      return NextResponse.json({ error: 'CSV 파일에 유효한 데이터가 없습니다' }, { status: 400 });
    }

    // 4. 순수 작품명 추출 + 중복 제거
    const parsedItems = rawItems.map(item => ({
      title: extractPureTitle(item.title),
      date: item.date,
    }));
    const uniqueItems = deduplicateByTitle(parsedItems);

    // 5. 기존에 저장된 포스터+장르 정보 조회 (TMDB 호출 최소화)
    const admin = createAdminClient();
    const { data: existingRows } = await admin
      .from('netflix_history')
      .select('title, poster_url, metadata')
      .eq('user_id', user.id);

    // 기존 데이터 맵: title → { posterUrl, genres }
    const existingDataMap = new Map<string, { posterUrl: string; genres: string[] }>();
    for (const row of existingRows || []) {
      if (row.poster_url) {
        const genres = (row.metadata as { genres?: string[] })?.genres || [];
        existingDataMap.set(row.title, { posterUrl: row.poster_url, genres });
      }
    }

    // 6. TMDB에서 포스터 + 장르 가져오기 (5개씩 병렬)
    const itemsWithPosters = await fetchTmdbInBatches(uniqueItems, existingDataMap);

    // 7. 기존 데이터 삭제 (재업로드 시 전체 교체)
    await admin
      .from('netflix_history')
      .delete()
      .eq('user_id', user.id);

    // 8. 새 데이터 삽입
    const insertData = itemsWithPosters.map(item => ({
      user_id: user.id,
      title: item.title,
      date_watched: item.date,
      poster_url: item.posterUrl,
      metadata: { genres: item.genres, media_type: item.mediaType },
      uploaded_at: new Date().toISOString(),
    }));

    const { error: insertError } = await admin
      .from('netflix_history')
      .insert(insertData);

    if (insertError) {
      return NextResponse.json(
        { error: `저장 실패: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 9. 성공 응답
    return NextResponse.json({
      success: true,
      count: itemsWithPosters.length,
      message: `${itemsWithPosters.length}개의 작품이 저장되었습니다`,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { error: `업로드 처리 실패: ${message}` },
      { status: 500 }
    );
  }
}
