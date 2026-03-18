import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTopTracks } from '@/lib/api/spotify';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || 'medium_term';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: connection } = await supabase
      .from('platform_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'spotify')
      .single();

    if (!connection?.access_token) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 400 });
    }

    const data = await getTopTracks(connection.access_token, timeRange);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
