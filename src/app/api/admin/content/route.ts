import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getContent, saveContent, supabaseConfigured } from '@/lib/db';
import type { SiteContent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, content: await getContent() });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { content?: SiteContent };
    if (!body.content || typeof body.content !== 'object') {
      return NextResponse.json({ ok: false, error: 'Nothing to save.' }, { status: 400 });
    }
    await saveContent(body.content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save.';
    console.error('[admin/content] save failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
