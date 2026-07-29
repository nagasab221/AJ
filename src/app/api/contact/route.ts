import { NextResponse } from 'next/server';
import { clean, cleanEmail, cleanMultiline } from '@/lib/sanitize';
import { escapeHtml, sendTelegramMessage, telegramConfigured } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/** Contact form → Telegram. Nothing is stored; this is a message, not a record. */
export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; message?: unknown; locale?: unknown; company?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot.
  if (clean(body.company, 100)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 80);
  const email = cleanEmail(body.email);
  const message = cleanMultiline(body.message, 1500);

  if (!name || !email || !message) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!telegramConfigured()) {
    // Nowhere to send it, say so rather than pretending it arrived.
    console.warn('[api/contact] Telegram is not configured; message dropped.');
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const sent = await sendTelegramMessage(
    [
      '<b>New message from the website</b>',
      `Name: ${escapeHtml(name)}`,
      `Email: ${escapeHtml(email)}`,
      `Language: ${body.locale === 'ar' ? 'Arabic' : 'English'}`,
      '',
      escapeHtml(message)
    ].join('\n')
  );

  return NextResponse.json({ ok: sent }, { status: sent ? 200 : 502 });
}
