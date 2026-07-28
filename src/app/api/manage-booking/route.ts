import { NextResponse } from 'next/server';

import {
  cancelReservation,
  findReservation,
  getContent,
  isSlotTaken,
  rescheduleReservation,
  supabaseConfigured
} from '@/lib/db';
import { isBookableSlot, normalizeUAEPhone, formatDateLong, formatSlot } from '@/lib/booking';
import { clean } from '@/lib/sanitize';
import { escapeHtml, sendTelegramMessage } from '@/lib/telegram';
import type { StoredReservation } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Only the fields a customer is allowed to see back. */
function publicView(r: StoredReservation) {
  return {
    ref: r.ref,
    name: r.name,
    date: r.date,
    time: r.time,
    services: r.services,
    total: r.total,
    duration: r.duration,
    venue: r.venue,
    status: r.status,
    paymentStatus: r.paymentStatus
  };
}

export async function POST(request: Request) {
  let body: { action?: unknown; ref?: unknown; phone?: unknown; date?: unknown; time?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 });
  }

  const action = clean(body.action, 20);
  const ref = clean(body.ref, 12).toUpperCase();
  const phone = normalizeUAEPhone(clean(body.phone, 24));

  // Reference + the phone it was booked with is the credential pair. Both must
  // match, so a guessed reference alone reveals nothing.
  if (!ref || !phone) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  try {
    const booking = await findReservation(ref, phone);
    if (!booking) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    if (action === 'find') {
      return NextResponse.json({ ok: true, booking: publicView(booking) });
    }

    const changeable = booking.status === 'new' || booking.status === 'confirmed';
    if (!changeable) {
      return NextResponse.json({ ok: false, error: 'locked' }, { status: 409 });
    }

    if (action === 'cancel') {
      const done = await cancelReservation(ref, phone);
      if (!done) return NextResponse.json({ ok: false, error: 'locked' }, { status: 409 });

      await sendTelegramMessage(
        [
          '<b>Booking cancelled by the client</b>',
          `Ref: <b>${escapeHtml(ref)}</b>`,
          `Name: ${escapeHtml(booking.name)}`,
          `Was: ${escapeHtml(formatDateLong(booking.date, 'en'))} at ${escapeHtml(formatSlot(booking.time, 'en'))}`
        ].join('\n')
      );

      return NextResponse.json({
        ok: true,
        booking: { ...publicView(booking), status: 'cancelled' as const }
      });
    }

    if (action === 'reschedule') {
      const date = clean(body.date, 10);
      const time = clean(body.time, 5);
      const settings = (await getContent()).booking;

      if (!isBookableSlot(settings, date, time, booking.duration || 30)) {
        return NextResponse.json({ ok: false, error: 'slot' }, { status: 400 });
      }
      if (await isSlotTaken(date, time)) {
        return NextResponse.json({ ok: false, error: 'slot_taken' }, { status: 409 });
      }

      const done = await rescheduleReservation(ref, phone, date, time);
      if (!done) return NextResponse.json({ ok: false, error: 'locked' }, { status: 409 });

      await sendTelegramMessage(
        [
          '<b>Booking moved by the client</b>',
          `Ref: <b>${escapeHtml(ref)}</b>`,
          `Name: ${escapeHtml(booking.name)}`,
          `From: ${escapeHtml(formatDateLong(booking.date, 'en'))} at ${escapeHtml(formatSlot(booking.time, 'en'))}`,
          `To: ${escapeHtml(formatDateLong(date, 'en'))} at ${escapeHtml(formatSlot(time, 'en'))}`
        ].join('\n')
      );

      return NextResponse.json({
        ok: true,
        booking: { ...publicView(booking), date, time, status: 'new' as const }
      });
    }

    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  } catch (err) {
    console.error('[api/manage-booking] failed:', err);
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }
}
