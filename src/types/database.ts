export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          kakao_id: number | null;
          nickname: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          kakao_id?: number | null;
          nickname: string;
          avatar_url?: string | null;
        };
        Update: {
          nickname?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      platform_connections: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          access_token: string | null;
          refresh_token: string | null;
          platform_user_id: string | null;
          platform_username: string | null;
          token_expires_at: string | null;
          metadata: Json;
          connected_at: string;
        };
        Insert: {
          user_id: string;
          platform: string;
          access_token?: string | null;
          refresh_token?: string | null;
          platform_user_id?: string | null;
          platform_username?: string | null;
          token_expires_at?: string | null;
          metadata?: Json;
        };
        Update: {
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          metadata?: Json;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          activity_type: string;
          content_title: string;
          content_subtitle: string | null;
          content_image_url: string | null;
          content_external_url: string | null;
          content_metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          platform: string;
          activity_type: string;
          content_title: string;
          content_subtitle?: string | null;
          content_image_url?: string | null;
          content_external_url?: string | null;
          content_metadata?: Json;
        };
        Update: {
          content_metadata?: Json;
        };
      };
    };
  };
}
