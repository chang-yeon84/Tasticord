export const PLATFORM_COLORS: Record<string, string> = {
  spotify: '#1DB954',
  apple_music: '#FC3C44',
  steam: '#1b2838',
  netflix: '#E50914',
};

export const PLATFORM_NAMES: Record<string, string> = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  steam: 'Steam',
  netflix: 'Netflix',
};

export const ACTIVITY_LABELS: Record<string, string> = {
  listening: 'Listening Now',
  playing: 'Playing',
  watching: '시청 중',
  liked: '좋아요',
  playlist_add: '플레이리스트 추가',
};

export const FEED_FILTERS = ['전체', '음악', '게임', '영화/TV'] as const;

export const FILTER_TO_PLATFORM: Record<string, string[]> = {
  '전체': [],
  '음악': ['spotify', 'apple_music'],
  '게임': ['steam'],
  '영화/TV': ['netflix'],
};
