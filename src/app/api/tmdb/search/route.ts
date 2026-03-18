import { NextResponse } from 'next/server';
import { searchMovie, searchTv } from '@/lib/api/tmdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'movie';

    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const data = type === 'tv' ? await searchTv(query) : await searchMovie(query);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
