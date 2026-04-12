import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// DM 채팅방 생성 (또는 기존 채팅방 반환)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendId } = await request.json();
    if (!friendId) return NextResponse.json({ error: 'friendId required' }, { status: 400 });

    const admin = createAdminClient();

    // 기존 DM 채팅방이 있는지 확인
    const { data: myRooms } = await admin
      .from('chat_members')
      .select('room_id')
      .eq('user_id', user.id);

    const { data: friendRooms } = await admin
      .from('chat_members')
      .select('room_id')
      .eq('user_id', friendId);

    const myRoomIds = (myRooms || []).map(r => r.room_id);
    const friendRoomIds = (friendRooms || []).map(r => r.room_id);
    const commonRoomIds = myRoomIds.filter(id => friendRoomIds.includes(id));

    // 공통 채팅방 중 DM 타입인 것 찾기
    if (commonRoomIds.length > 0) {
      const { data: existingRoom } = await admin
        .from('chat_rooms')
        .select('*')
        .in('id', commonRoomIds)
        .eq('type', 'dm')
        .single();

      if (existingRoom) {
        return NextResponse.json({ room: existingRoom, created: false });
      }
    }

    // 새 DM 채팅방 생성
    const { data: newRoom, error: roomError } = await admin
      .from('chat_rooms')
      .insert({ type: 'dm' })
      .select()
      .single();

    if (roomError || !newRoom) {
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    // 멤버 추가
    await admin.from('chat_members').insert([
      { room_id: newRoom.id, user_id: user.id },
      { room_id: newRoom.id, user_id: friendId },
    ]);

    return NextResponse.json({ room: newRoom, created: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
  }
}
