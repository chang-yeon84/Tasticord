interface TasteData {
  topArtists?: Array<{ name: string; genres?: string[] }>;
  topTracks?: Array<{ name: string; artist: string }>;
  topGames?: Array<{ name: string; playtime_hours: number }>;
  watchHistory?: Array<{ title: string; genre?: string }>;
}

export async function generateTasteReport(tasteData: TasteData): Promise<{
  summary: string;
  tags: string[];
}> {
  const prompt = buildPrompt(tasteData);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || '';

  return parseResponse(text);
}

function buildPrompt(data: TasteData): string {
  const parts: string[] = ['다음은 한 사용자의 취향 데이터입니다. 이 데이터를 분석하여 한국어로 취향 레포트를 작성해주세요.\n'];

  if (data.topArtists?.length) {
    parts.push('## 탑 아티스트');
    data.topArtists.forEach((a, i) => parts.push(`${i + 1}. ${a.name} (장르: ${a.genres?.join(', ') || '알 수 없음'})`));
  }

  if (data.topTracks?.length) {
    parts.push('\n## 탑 트랙');
    data.topTracks.forEach((t, i) => parts.push(`${i + 1}. ${t.name} - ${t.artist}`));
  }

  if (data.topGames?.length) {
    parts.push('\n## 탑 게임');
    data.topGames.forEach((g, i) => parts.push(`${i + 1}. ${g.name} (${g.playtime_hours}시간)`));
  }

  if (data.watchHistory?.length) {
    parts.push('\n## 시청 기록');
    data.watchHistory.forEach((w, i) => parts.push(`${i + 1}. ${w.title} (${w.genre || ''})`));
  }

  parts.push('\n---\n응답 형식 (JSON):\n{"summary": "2-3문장의 취향 분석", "tags": ["태그1", "태그2", "태그3"]}\n\nJSON만 응답해주세요.');

  return parts.join('\n');
}

function parseResponse(text: string): { summary: string; tags: string[] } {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fallback
  }
  return { summary: text, tags: [] };
}
