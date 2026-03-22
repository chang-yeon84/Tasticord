import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { platform } = await request.json();

    if (!platform) {
      return NextResponse.json({ error: '플랫폼을 지정해주세요' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // platform_connections에서 연동 정보 삭제
    const { error: connError } = await admin
      .from('platform_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform);

    if (connError) {
      return NextResponse.json({ error: connError.message }, { status: 500 });
    }

    // taste_cache에서 해당 플랫폼 캐시도 삭제
    await admin
      .from('taste_cache')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '연동 해제에 실패했습니다' }, { status: 500 });
  }
}
