// 두 사용자의 taste_profiles 스냅샷을 받아 축별 유사도를 계산 (순수 함수, 네트워크 없음)
// 유사도 = 자카드 계수(Jaccard): |교집합| / |합집합| × 100
// 이름은 정규화(trim+lowercase)해서 표기 흔들림을 흡수하되, 표시는 원본을 유지.

export interface TasteProfileData {
  music: { artists: string[]; genres: string[] };
  games: { games: string[]; genres: string[] };
  movies: { titles: string[]; genres: string[] };
}

export interface AxisCompare {
  available: boolean; // 양쪽 모두 이 축에 데이터가 있어야 true
  score: number; // 0~100
  // 항목별 세부 (표시용 — 원본 표기 유지)
  itemsLabel: string; // "아티스트" | "게임" | "작품"
  commonItems: string[];
  commonGenres: string[];
  // 친구한테는 있는데 나한테 없는 것 (추천 후보)
  newFromFriend: string[];
}

export interface CompareResult {
  overall: number; // 0~100 (사용 가능한 축들의 평균)
  music: AxisCompare;
  games: AxisCompare;
  movies: AxisCompare;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

// 정규화 키 → 원본 표기 (먼저 등장한 표기 유지)
function toMap(items: string[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const it of items) {
    const k = norm(it);
    if (k && !m.has(k)) m.set(k, it.trim());
  }
  return m;
}

function jaccard(aKeys: Set<string>, bKeys: Set<string>): number {
  if (aKeys.size === 0 && bKeys.size === 0) return 0;
  let inter = 0;
  for (const k of aKeys) if (bKeys.has(k)) inter += 1;
  const union = aKeys.size + bKeys.size - inter;
  return union === 0 ? 0 : Math.round((inter / union) * 100);
}

// 한 축(아티스트/게임/작품 + 장르) 비교
function compareAxis(
  itemsLabel: string,
  mineItems: string[],
  friendItems: string[],
  mineGenres: string[],
  friendGenres: string[],
  itemWeight: number // 아이템 vs 장르 가중치 (0~1). 나머지는 장르.
): AxisCompare {
  const mineHas = mineItems.length > 0 || mineGenres.length > 0;
  const friendHas = friendItems.length > 0 || friendGenres.length > 0;
  if (!mineHas || !friendHas) {
    return {
      available: false,
      score: 0,
      itemsLabel,
      commonItems: [],
      commonGenres: [],
      newFromFriend: [],
    };
  }

  const mineItemMap = toMap(mineItems);
  const friendItemMap = toMap(friendItems);
  const mineGenreMap = toMap(mineGenres);
  const friendGenreMap = toMap(friendGenres);

  const itemKeysA = new Set(mineItemMap.keys());
  const itemKeysB = new Set(friendItemMap.keys());
  const genreKeysA = new Set(mineGenreMap.keys());
  const genreKeysB = new Set(friendGenreMap.keys());

  const itemSim = jaccard(itemKeysA, itemKeysB);
  const genreSim = jaccard(genreKeysA, genreKeysB);

  // 한쪽 축만 데이터가 있으면 그쪽 100% 가중
  let score: number;
  const hasItems = itemKeysA.size > 0 && itemKeysB.size > 0;
  const hasGenres = genreKeysA.size > 0 && genreKeysB.size > 0;
  if (hasItems && hasGenres) score = Math.round(itemSim * itemWeight + genreSim * (1 - itemWeight));
  else if (hasItems) score = itemSim;
  else if (hasGenres) score = genreSim;
  else score = 0;

  const commonItems = [...itemKeysA]
    .filter((k) => itemKeysB.has(k))
    .map((k) => friendItemMap.get(k) ?? k);
  const commonGenres = [...genreKeysA]
    .filter((k) => genreKeysB.has(k))
    .map((k) => friendGenreMap.get(k) ?? k);
  const newFromFriend = [...itemKeysB]
    .filter((k) => !itemKeysA.has(k))
    .map((k) => friendItemMap.get(k) ?? k)
    .slice(0, 8);

  return {
    available: true,
    score,
    itemsLabel,
    commonItems,
    commonGenres,
    newFromFriend,
  };
}

export function compareTasteProfiles(
  mine: TasteProfileData,
  friend: TasteProfileData
): CompareResult {
  const music = compareAxis('아티스트', mine.music.artists, friend.music.artists, mine.music.genres, friend.music.genres, 0.6);
  const games = compareAxis('게임', mine.games.games, friend.games.games, mine.games.genres, friend.games.genres, 0.6);
  const movies = compareAxis('작품', mine.movies.titles, friend.movies.titles, mine.movies.genres, friend.movies.genres, 0.5);

  const axes = [music, games, movies].filter((a) => a.available);
  const overall =
    axes.length > 0 ? Math.round(axes.reduce((s, a) => s + a.score, 0) / axes.length) : 0;

  return { overall, music, games, movies };
}
