export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  external_urls: { spotify: string };
  duration_ms: number;
  uri: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string; height: number; width: number }>;
  genres: string[];
  external_urls: { spotify: string };
}

export interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number | null;
}

export interface SpotifyTopItems<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
