-- Tasticord Supabase DB Schema
-- Supabase SQL Editor에서 실행

-- 사용자 프로필 (카카오 로그인 후 확장 정보)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id BIGINT UNIQUE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 플랫폼 연동 정보
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'apple_music', 'youtube_music', 'steam', 'netflix', 'strava')),
  access_token TEXT,
  refresh_token TEXT,
  platform_user_id TEXT,
  platform_username TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- 카카오 친구 관계
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kakao_friend_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 피드 활동
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('listening', 'playing', 'watching', 'exercising', 'liked', 'playlist_add')),
  content_title TEXT NOT NULL,
  content_subtitle TEXT,
  content_image_url TEXT,
  content_external_url TEXT,
  content_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 피드 좋아요
CREATE TABLE activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- 피드 댓글
CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공동 플레이리스트
CREATE TABLE shared_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 플레이리스트 참여자
CREATE TABLE playlist_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES shared_playlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, user_id)
);

-- 플레이리스트 곡
CREATE TABLE playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES shared_playlists(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  image_url TEXT,
  spotify_uri TEXT,
  apple_music_id TEXT,
  duration_ms INTEGER,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅방
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('dm', 'playlist')),
  playlist_id UUID REFERENCES shared_playlists(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅 참여자
CREATE TABLE chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 채팅 메시지
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  embed_type TEXT CHECK (embed_type IN ('music', 'game', 'movie', NULL)),
  embed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 취향 레포트 캐시
CREATE TABLE taste_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 취향 캐시 (플랫폼별 가져온 데이터)
CREATE TABLE taste_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, data_type)
);

-- Netflix CSV 업로드 데이터
CREATE TABLE netflix_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date_watched DATE,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE taste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE taste_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE netflix_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 정책
-- ============================================

-- profiles: 본인 + 친구 프로필 읽기/본인 수정
CREATE POLICY "Users can read profiles" ON profiles FOR SELECT USING (
  id = auth.uid() OR
  id IN (SELECT friend_id FROM friendships WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- platform_connections: 본인 데이터 읽기/쓰기
CREATE POLICY "Users can read own connections" ON platform_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own connections" ON platform_connections FOR ALL USING (auth.uid() = user_id);

-- friendships: 본인 친구 관계 읽기
CREATE POLICY "Users can read own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id);

-- activities: 본인 + 친구 활동 읽기, 본인 활동 생성
CREATE POLICY "Users can read friend activities" ON activities FOR SELECT USING (
  auth.uid() = user_id OR
  user_id IN (SELECT friend_id FROM friendships WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- activity_likes: 본인 좋아요 관리
CREATE POLICY "Users can manage own likes" ON activity_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read likes" ON activity_likes FOR SELECT USING (true);

-- activity_comments: 본인 댓글 관리, 모든 댓글 읽기
CREATE POLICY "Users can manage own comments" ON activity_comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read comments" ON activity_comments FOR SELECT USING (true);

-- shared_playlists: 참여자만 읽기, 생성자 관리
CREATE POLICY "Users can read joined playlists" ON shared_playlists FOR SELECT USING (
  id IN (SELECT playlist_id FROM playlist_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create playlists" ON shared_playlists FOR INSERT WITH CHECK (auth.uid() = created_by);

-- playlist_members: 참여 플레이리스트 읽기
CREATE POLICY "Users can read playlist members" ON playlist_members FOR SELECT USING (
  playlist_id IN (SELECT playlist_id FROM playlist_members WHERE user_id = auth.uid())
);

-- playlist_songs: 참여 플레이리스트 곡 읽기, 본인 곡 추가
CREATE POLICY "Users can read playlist songs" ON playlist_songs FOR SELECT USING (
  playlist_id IN (SELECT playlist_id FROM playlist_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can add songs" ON playlist_songs FOR INSERT WITH CHECK (auth.uid() = added_by);

-- chat_rooms: 참여 채팅방 읽기
CREATE POLICY "Users can read joined rooms" ON chat_rooms FOR SELECT USING (
  id IN (SELECT room_id FROM chat_members WHERE user_id = auth.uid())
);

-- chat_members: 참여 채팅방 멤버 읽기
CREATE POLICY "Users can read chat members" ON chat_members FOR SELECT USING (
  room_id IN (SELECT room_id FROM chat_members WHERE user_id = auth.uid())
);

-- chat_members: 본인의 last_read_at 업데이트 허용
CREATE POLICY "Users can update own membership" ON chat_members
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- chat_messages: 참여 채팅방 메시지 읽기/보내기
CREATE POLICY "Users can read chat messages" ON chat_messages FOR SELECT USING (
  room_id IN (SELECT room_id FROM chat_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- taste_reports: 본인 레포트 읽기
CREATE POLICY "Users can read own reports" ON taste_reports FOR SELECT USING (auth.uid() = user_id);

-- taste_cache: 본인 캐시 읽기
CREATE POLICY "Users can read own cache" ON taste_cache FOR SELECT USING (auth.uid() = user_id);

-- netflix_history: 본인 기록 관리
CREATE POLICY "Users can manage own netflix" ON netflix_history FOR ALL USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX idx_taste_cache_user_platform ON taste_cache(user_id, platform, data_type);
