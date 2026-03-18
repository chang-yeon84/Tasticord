import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, artist, album, image_url, spotify_uri, apple_music_id, duration_ms } = body;

    const { data, error } = await supabase
      .from('playlist_songs')
      .insert({ playlist_id: id, added_by: user.id, title, artist, album, image_url, spotify_uri, apple_music_id, duration_ms })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('shared_playlists').update({ updated_at: new Date().toISOString() }).eq('id', id);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to add song' }, { status: 500 });
  }
}
