# Tasticord

친구들과 취향을 공유하고 비교하는 소셜 플랫폼.
카카오 로그인으로 기존 카톡 친구 관계를 활용하고,
Spotify(음악), Steam(게임) 데이터를 연동해 친구들의 취향을 한눈에 볼 수 있는 서비스입니다.

## 핵심 기능

- 카카오 로그인 기반 친구 연동 (별도 친구 추가 불필요)
- Spotify Top Tracks / 현재 재생 중인 곡 공유
- Steam 플레이타임 / 보유 게임 / 도전과제 공유
- 희귀도 시스템: Spotify Top Tracks + Last.fm listeners 수 조합으로 음악 희귀도 계산, Steam 도전과제 달성률로 게임 희귀도 계산
- 친구에게 음악/게임 추천 메시지 전송 → 클릭 시 Spotify/Steam 앱으로 딥링크 이동
- 취향 비교 기능 (나 vs 친구 음악/게임 취향 유사도)
- 공유 카드 생성 (인스타 스토리용 희귀도 결과 카드)

## 사용 API

- 카카오 로그인 API (친구 목록 연동)
- Spotify Web API (개발 모드, 5명 제한)
  - GET /me/top/tracks, /me/top/artists
  - GET /me/player/currently-playing
  - GET /me/player/recently-played
- Last.fm API (track.getInfo로 전세계 listeners 수 조회 → 희귀도 계산용, 유저 가입 불필요)
- Steam Web API (플레이타임, 도전과제 달성률, 보유 게임)

## 기술 스택

- 프론트엔드: Next.js + Tailwind CSS + TypeScript
- DB: Supabase (PostgreSQL)
- 인증: Supabase Auth (카카오 OAuth + @supabase/ssr)
- 배포: Vercel

## 시작하기

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## 참고 사항

- 대학생 2인 팀
- 개발 경험 초반 수준
