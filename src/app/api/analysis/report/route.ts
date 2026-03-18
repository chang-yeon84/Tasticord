import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTasteReport } from '@/lib/ai/report-generator';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: cached } = await supabase
      .from('taste_reports')
      .select('*')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (cached) return NextResponse.json(cached);

    const { data: tasteCache } = await supabase
      .from('taste_cache')
      .select('*')
      .eq('user_id', user.id);

    const tasteData: Record<string, unknown> = {};
    tasteCache?.forEach((item: { data_type: string; data: unknown }) => {
      tasteData[item.data_type] = item.data;
    });

    const report = await generateTasteReport(tasteData as Parameters<typeof generateTasteReport>[0]);

    const { data: saved } = await supabase
      .from('taste_reports')
      .insert({ user_id: user.id, report_data: report, tags: report.tags })
      .select()
      .single();

    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
