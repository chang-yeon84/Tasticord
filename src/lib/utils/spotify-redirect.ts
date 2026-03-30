/**
 * Spotify redirect_uri 생성.
 * Spotify Dashboard가 localhost를 거부하므로,
 * 로컬 개발 시 localhost → 127.0.0.1로 치환.
 * 배포 환경에서는 origin 그대로 사용.
 */
export function getSpotifyRedirectUri(origin: string) {
  const normalized = origin.replace('//localhost:', '//127.0.0.1:');
  return `${normalized}/callback`;
}
