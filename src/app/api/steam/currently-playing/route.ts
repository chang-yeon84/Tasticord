import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlayerSummaries } from '@/lib/api/steam';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: connection } = await supabase
      .from('platform_connections')
      .select('platform_user_id')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .single();

    if (!connection?.platform_user_id) {
      return NextResponse.json({ error: 'Steam not connected' }, { status: 400 });
    }

    const data = await getPlayerSummaries(connection.platform_user_id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
