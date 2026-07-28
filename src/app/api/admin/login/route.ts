import { NextResponse } from 'next/server';
import { checkPassword, createSessionValue, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';
import { clean } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: { password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    console.error('[admin] ADMIN_PASSWORD / ADMIN_SESSION_SECRET are not set.');
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  const ok = await checkPassword(clean(body.password, 200));
  if (!ok) {
    // A deliberate pause blunts online guessing without needing a rate limiter.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
  return response;
}
