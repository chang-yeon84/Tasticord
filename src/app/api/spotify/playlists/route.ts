import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPlaylist } from '@/lib/api/spotify';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: connection } = await supabase
      .from('platform_connections')
      .select('access_token, platform_user_id')
      .eq('user_id', user.id)
      .eq('platform', 'spotify')
      .single();

    if (!connection?.access_token || !connection?.platform_user_id) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 400 });
    }

    const body = await request.json();
    const { name, trackUris } = body;

    const data = await createPlaylist(connection.access_token, connection.platform_user_id, name, trackUris || []);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
