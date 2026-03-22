import { NextRequest, NextResponse } from 'next/server';
import { getAppDetails } from '@/lib/api/steam';

export async function GET(request: NextRequest) {
  const appid = request.nextUrl.searchParams.get('appid');
  if (!appid) return NextResponse.json({ error: 'Missing appid' }, { status: 400 });

  try {
    const details = await getAppDetails(Number(appid));
    if (details?.header_image) {
      return NextResponse.redirect(details.header_image);
    }
    return NextResponse.json({ error: 'No image found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
