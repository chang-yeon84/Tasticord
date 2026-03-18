import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('shared_playlists')
      .select('*, playlist_members(user_id, profiles:profiles(*)), playlist_songs(*)')
      .order('updated_at', { ascending: false });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, memberIds } = body;

    const { data: playlist, error } = await supabase
      .from('shared_playlists')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (error) throw error;

    const members = [user.id, ...(memberIds || [])].map((userId: string) => ({
      playlist_id: playlist.id,
      user_id: userId,
    }));

    await supabase.from('playlist_members').insert(members);
    await supabase.from('chat_rooms').insert({ type: 'playlist', playlist_id: playlist.id });

    return NextResponse.json(playlist);
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
