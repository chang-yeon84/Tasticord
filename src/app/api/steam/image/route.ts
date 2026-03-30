import { NextRequest, NextResponse } from 'next/server';
import { getAppDetails } from '@/lib/api/steam';

export async function GET(request: NextRequest) {
  const appid = request.nextUrl.searchParams.get('appid');
  if (!appid) return NextResponse.json({ error: 'Missing appid' }, { status: 400 });

  try {
    const details = await getAppDetails(Number(appid));
    const imageUrl = details?.header_image || details?.capsule_image || null;
    if (imageUrl) {
      // 이미지를 프록시로 직접 전달 (redirect 대신)
      const imgRes = await fetch(imageUrl);
      if (imgRes.ok) {
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        const buffer = await imgRes.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }
    return NextResponse.json({ error: 'No image found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
