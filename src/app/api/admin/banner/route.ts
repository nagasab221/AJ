import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getBanner, saveBanner, supabaseConfigured } from '@/lib/db';
import { clean, cleanLink } from '@/lib/sanitize';
import { BANNER_STYLES, type BannerStyle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, banner: await getBanner() });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const current = await getBanner();

    const text = (body.text ?? {}) as { en?: unknown; ar?: unknown };
    const linkLabel = (body.linkLabel ?? {}) as { en?: unknown; ar?: unknown };
    const style = clean(body.style, 20) as BannerStyle;

    await saveBanner({
      enabled: body.enabled === true,
      text: { en: clean(text.en, 200), ar: clean(text.ar, 200) },
      link: cleanLink(body.link),
      linkLabel: { en: clean(linkLabel.en, 40), ar: clean(linkLabel.ar, 40) },
      style: BANNER_STYLES.includes(style) ? style : 'palm',
      // Bumping the version brings the bar back for people who dismissed the
      // previous message, a new announcement should not stay hidden.
      version: body.bumpVersion === true ? current.version + 1 : current.version,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, banner: await getBanner() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save the banner.';
    console.error('[admin/banner] save failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
