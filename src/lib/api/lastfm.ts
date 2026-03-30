const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

// 영어 장르명 → 한글 매핑
const GENRE_KO: Record<string, string> = {
  'rock': '록',
  'pop': '팝',
  'indie': '인디',
  'alternative': '얼터너티브',
  'alternative rock': '얼터너티브 록',
  'indie rock': '인디 록',
  'indie pop': '인디 팝',
  'electronic': '일렉트로닉',
  'dance': '댄스',
  'edm': 'EDM',
  'hip-hop': '힙합',
  'hip hop': '힙합',
  'rap': '랩',
  'r&b': 'R&B',
  'rnb': 'R&B',
  'soul': '소울',
  'jazz': '재즈',
  'classical': '클래식',
  'blues': '블루스',
  'country': '컨트리',
  'folk': '포크',
  'metal': '메탈',
  'heavy metal': '헤비메탈',
  'punk': '펑크',
  'punk rock': '펑크 록',
  'k-pop': 'K-Pop',
  'kpop': 'K-Pop',
  'korean': '한국 음악',
  'j-pop': 'J-Pop',
  'jpop': 'J-Pop',
  'j-rock': 'J-Rock',
  'anime': '애니메이션',
  'reggae': '레게',
  'latin': '라틴',
  'funk': '펑크',
  'disco': '디스코',
  'house': '하우스',
  'techno': '테크노',
  'trance': '트랜스',
  'ambient': '앰비언트',
  'lo-fi': '로파이',
  'lofi': '로파이',
  'chillwave': '칠웨이브',
  'synthpop': '신스팝',
  'synth-pop': '신스팝',
  'new wave': '뉴웨이브',
  'post-punk': '포스트 펑크',
  'shoegaze': '슈게이즈',
  'dream pop': '드림 팝',
  'psychedelic': '사이키델릭',
  'grunge': '그런지',
  'emo': '이모',
  'singer-songwriter': '싱어송라이터',
  'acoustic': '어쿠스틱',
  'ballad': '발라드',
  'soft rock': '소프트 록',
  'hard rock': '하드 록',
  'progressive rock': '프로그레시브 록',
  'britpop': '브릿팝',
  'garage rock': '개러지 록',
  'post-rock': '포스트 록',
  'math rock': '매스 록',
  'trap': '트랩',
  'drill': '드릴',
  'boom bap': '붐뱁',
  'gospel': '가스펠',
  'reggaeton': '레게톤',
  'bossa nova': '보사노바',
  'ska': '스카',
  'dub': '덥',
  'dubstep': '덥스텝',
  'drum and bass': '드럼 앤 베이스',
  'dnb': '드럼 앤 베이스',
  'idm': 'IDM',
  'experimental': '실험 음악',
  'noise': '노이즈',
  'industrial': '인더스트리얼',
  'gothic': '고딕',
  'darkwave': '다크웨이브',
  'world': '월드 뮤직',
  'afrobeats': '아프로비츠',
  'soundtrack': '사운드트랙',
  'ost': 'OST',
  'instrumental': '인스트루멘탈',
  'chill': '칠',
  'downtempo': '다운템포',
  'trip-hop': '트립합',
  'trip hop': '트립합',
  'nu metal': '뉴메탈',
  'metalcore': '메탈코어',
  'deathcore': '데스코어',
  'death metal': '데스 메탈',
  'black metal': '블랙 메탈',
  'thrash metal': '스래시 메탈',
  'power metal': '파워 메탈',
  'symphonic metal': '심포닉 메탈',
  'hardcore': '하드코어',
  'post-hardcore': '포스트 하드코어',
  'screamo': '스크리모',
  'mathcore': '매스코어',
  'progressive metal': '프로그레시브 메탈',
  'stoner rock': '스토너 록',
  'doom metal': '둠 메탈',
  'sludge metal': '슬러지 메탈',
  'folk rock': '포크 록',
  'celtic': '켈틱',
  'americana': '아메리카나',
  'bluegrass': '블루그래스',
  'swing': '스윙',
  'big band': '빅밴드',
  'smooth jazz': '스무스 재즈',
  'acid jazz': '애시드 재즈',
  'fusion': '퓨전',
  'new age': '뉴에이지',
  'meditation': '명상 음악',
  'opera': '오페라',
  'chamber music': '실내악',
  'choral': '합창',
  'minimal': '미니멀',
  'glitch': '글리치',
  'vaporwave': '베이퍼웨이브',
  'future bass': '퓨처 베이스',
  'tropical house': '트로피컬 하우스',
  'deep house': '딥 하우스',
  'progressive house': '프로그레시브 하우스',
  'electro': '일렉트로',
  'breakbeat': '브레이크비트',
  'garage': '개러지',
  'uk garage': 'UK 개러지',
  'grime': '그라임',
  'dancehall': '댄스홀',
  'samba': '삼바',
  'tango': '탱고',
  'flamenco': '플라멩코',
  'city pop': '시티 팝',
  'visual kei': '비주얼 케이',
  'enka': '엔카',
  'mandopop': '만도팝',
  'cantopop': '칸토팝',
  'c-pop': 'C-Pop',
  'thai pop': '타이 팝',
  'bollywood': '볼리우드',
  'trot': '트로트',
};

// 영어 태그를 한글로 변환 (매핑 없으면 원본 유지)
function toKoreanGenre(tag: string): string {
  return GENRE_KO[tag] || tag;
}

interface LastfmTrackInfo {
  toptags?: {
    tag: { name: string; count: number; url: string }[];
  };
}

// Last.fm에서 곡의 태그(장르) 정보 조회
export async function getTrackTags(artist: string, track: string): Promise<string[]> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error('LASTFM_API_KEY is not set');

  const params = new URLSearchParams({
    method: 'track.getTopTags',
    artist,
    track,
    api_key: apiKey,
    format: 'json',
  });

  const res = await fetch(`${LASTFM_API_BASE}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();

  if (data.error || !data.toptags?.tag) return [];

  // count가 높은 상위 태그만 반환 (노이즈 필터링)
  return data.toptags.tag
    .filter((t: { name: string; count: number }) => t.count >= 20)
    .slice(0, 5)
    .map((t: { name: string }) => t.name.toLowerCase());
}

// 여러 곡의 장르를 한번에 조회하고 집계
export async function getTracksGenreDistribution(
  tracks: { name: string; artist: string }[]
): Promise<{ genres: { name: string; count: number; percentage: number }[]; totalTracks: number }> {
  const genreCount: Record<string, number> = {};
  let tracksWithGenre = 0;

  // 병렬로 조회하되 5개씩 배치 처리 (rate limit 방지)
  const BATCH_SIZE = 5;
  for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
    const batch = tracks.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(t => getTrackTags(t.artist, t.name))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        tracksWithGenre++;
        // 각 곡의 태그에 가중치 부여 (첫 번째 태그가 가장 관련성 높음)
        result.value.forEach((tag, idx) => {
          const weight = idx === 0 ? 3 : idx === 1 ? 2 : 1;
          const koTag = toKoreanGenre(tag);
          genreCount[koTag] = (genreCount[koTag] || 0) + weight;
        });
      }
    }
  }

  const totalWeight = Object.values(genreCount).reduce((sum, c) => sum + c, 0);
  const genres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalWeight > 0 ? Math.round((count / totalWeight) * 100) : 0,
    }));

  return { genres, totalTracks: tracksWithGenre };
}

// Last.fm에서 곡의 listeners 수 조회
export async function getTrackListeners(artist: string, track: string): Promise<number | null> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    method: 'track.getInfo',
    artist,
    track,
    api_key: apiKey,
    format: 'json',
  });

  try {
    const res = await fetch(`${LASTFM_API_BASE}?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.error || !data.track) return null;

    return parseInt(data.track.listeners, 10) || null;
  } catch {
    return null;
  }
}
