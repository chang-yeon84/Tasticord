import { NextResponse } from 'next/server';

// Spotify가 127.0.0.1:3000/callback 으로 리다이렉트하면
// 쿠키가 있는 localhost로 전달하여 세션 유지
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams.toString();

  // 127.0.0.1로 들어왔으면 localhost로 전환 (Supabase 쿠키 호환)
  if (url.hostname === '127.0.0.1') {
    return NextResponse.redirect(
      `http://localhost:${url.port}/api/auth/spotify/callback?${params}`
    );
  }

  return NextResponse.redirect(new URL(`/api/auth/spotify/callback?${params}`, request.url));
}
