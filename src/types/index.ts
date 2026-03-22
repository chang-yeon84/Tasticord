export type Platform = 'spotify' | 'apple_music' | 'steam' | 'netflix';
export type ActivityType = 'listening' | 'playing' | 'watching' | 'liked' | 'playlist_add';
export type ChatType = 'dm' | 'playlist';
export type EmbedType = 'music' | 'game' | 'movie';

export interface Profile {
  id: string;
  kakao_id: number | null;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformConnection {
  id: string;
  user_id: string;
  platform: Platform;
  access_token: string | null;
  refresh_token: string | null;
  platform_user_id: string | null;
  platform_username: string | null;
  token_expires_at: string | null;
  metadata: Record<string, unknown>;
  connected_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  platform: string;
  activity_type: ActivityType;
  content_title: string;
  content_subtitle: string | null;
  content_image_url: string | null;
  content_external_url: string | null;
  content_metadata: Record<string, unknown>;
  created_at: string;
  // joined
  profile?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface ActivityLike {
  id: string;
  activity_id: string;
  user_id: string;
  created_at: string;
}

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface SharedPlaylist {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: Profile[];
  songs?: PlaylistSong[];
  songs_count?: number;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  added_by: string;
  title: string;
  artist: string;
  album: string | null;
  image_url: string | null;
  spotify_uri: string | null;
  apple_music_id: string | null;
  duration_ms: number | null;
  added_at: string;
  added_by_profile?: Profile;
}

export interface ChatRoom {
  id: string;
  type: ChatType;
  playlist_id: string | null;
  created_at: string;
  members?: ChatMember[];
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface ChatMember {
  id: string;
  room_id: string;
  user_id: string;
  last_read_at: string;
  profile?: Profile;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  embed_type: EmbedType | null;
  embed_data: Record<string, unknown> | null;
  created_at: string;
  sender?: Profile;
}

export interface TasteReport {
  id: string;
  user_id: string;
  report_data: {
    summary: string;
    tags: string[];
    top_artists?: Array<{ name: string; image_url?: string; play_count?: number }>;
    top_games?: Array<{ name: string; image_url?: string; playtime_hours?: number }>;
  };
  tags: string[];
  generated_at: string;
  expires_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  kakao_friend_id: number | null;
  created_at: string;
  friend?: Profile;
}
