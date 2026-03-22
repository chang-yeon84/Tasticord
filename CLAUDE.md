# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tasticord is a social taste-sharing platform built with Next.js 16 (App Router). Users log in via Kakao OAuth, connect entertainment platforms (Spotify, Apple Music, YouTube Music, Steam, Netflix, Strava), and discover shared interests with friends through an activity feed. The UI is entirely in Korean.

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint (eslint alone, no args)
```

No test framework is configured.

## Architecture

**Stack:** Next.js 16 + React 19 + TypeScript, Supabase (Postgres + Auth), Tailwind CSS 4, Zustand, Claude API (Anthropic)

### App Router Layout

- `src/app/(main)/` — authenticated pages (feed, friends, profile, analysis, messages) wrapped in sidebar/mobile nav layout
- `src/app/auth/` — Kakao login page and OAuth callback
- `src/app/api/` — API routes organized by platform (`spotify/`, `steam/`, `youtube-music/`, `apple-music/`, `kakao/`, `tmdb/`) plus `auth/`, `playlists/`, `analysis/`
- `src/middleware.ts` — redirects unauthenticated users; excludes `_next`, `auth`, and `api` paths

### Auth Flow

Kakao OAuth → Supabase Auth. Tokens stored as cookies via `@supabase/ssr`. Three Supabase clients in `src/lib/supabase/`: browser (`client.ts`), server component (`server.ts`), admin/service-role (`admin.ts`).

### Platform Integrations

Each platform has an OAuth flow (API routes in `src/app/api/auth/{platform}/`) and a data-fetching client (`src/lib/api/{platform}.ts`). OAuth tokens are stored in the `platform_connections` table (one row per user+platform). Spotify has token refresh logic. OAuth callbacks use step-by-step error tracking (step1–step4) with encoded error messages passed as query params.

### Data Flow

- **Feed:** `useFeed` hook fetches from `activities` table with cursor-based pagination (by `created_at`), 20 items per page, filterable by platform type
- **AI Reports:** `src/lib/ai/report-generator.ts` calls Claude (claude-sonnet-4-20250514) to generate taste profile summaries + personality tags, cached in `taste_reports` table with 7-day expiry
- **State:** Zustand store (`src/stores/useAppStore.ts`) holds `currentUser` and `feedFilter`

### Database

Schema defined in `supabase-schema.sql`. Key tables: `profiles`, `platform_connections`, `friendships`, `activities`, `activity_likes`, `activity_comments`, `shared_playlists`, `playlist_members`, `playlist_songs`, `chat_rooms`, `chat_members`, `chat_messages`, `taste_reports`, `taste_cache`, `netflix_history`. All tables have RLS enabled with policies scoped to the authenticated user and their friends.

### Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `STEAM_API_KEY`, `ANTHROPIC_API_KEY`. Optional: `TMDB_API_KEY`.

### Styling

Dark theme (`bg-[#09090b]`), Tailwind CSS 4, fonts: Outfit (Latin) + Noto Sans KR (Korean). Platform-specific colors defined in `src/lib/utils/constants.ts`. Remote image domains configured in `next.config.ts` for Kakao, Spotify, Steam, TMDB, YouTube CDNs.
