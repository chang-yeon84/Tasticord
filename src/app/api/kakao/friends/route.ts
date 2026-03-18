import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get friends from friendships table with profiles
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id, friend:profiles!friendships_friend_id_fkey(*)')
      .eq('user_id', user.id);

    return NextResponse.json({ friends: friendships || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}
