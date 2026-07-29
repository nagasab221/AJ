import { NextResponse } from 'next/server';

import {
  addReservation,
  getContent,
  isSlotTaken,
  redeemPromoCode,
  supabaseConfigured
} from '@/lib/db';
import { isBookableSlot, normalizeUAEPhone, formatDateLong, formatSlot } from '@/lib/booking';
import { computeTotals, depositFor, toBookedService } from '@/lib/pricing';
import { validatePromoCode, LOW_USES_THRESHOLD } from '@/lib/promo';
import { clean, cleanMultiline, cleanPromoCode } from '@/lib/sanitize';
import { escapeHtml, sendTelegramMessage } from '@/lib/telegram';
import { stripeConfigured } from '@/lib/stripe';
import { formatAED, makeBookingRef } from '@/lib/utils';
import type { BookedVenue, BookingArea, Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Body {
  name?: unknown;
  phone?: unknown;
  serviceIds?: unknown;
  venue?: unknown;
  address?: unknown;
  area?: unknown;
  date?: unknown;
  time?: unknown;
  notes?: unknown;
  promoCode?: unknown;
  payNow?: unknown;
  locale?: unknown;
  company?: unknown;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  // Honeypot, bots fill every field they find. Answer as if it worked so they
  // don't learn anything, but write nothing.
  if (clean(body.company, 100)) {
    return NextResponse.json({ ok: true, ref: makeBookingRef(), depositDue: 0, payable: false });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 });
  }

  const name = clean(body.name, 80);
  const phone = normalizeUAEPhone(clean(body.phone, 24));
  const locale: Locale = body.locale === 'ar' ? 'ar' : 'en';

  if (!name) return NextResponse.json({ ok: false, error: 'name' }, { status: 400 });
  if (!phone) return NextResponse.json({ ok: false, error: 'phone' }, { status: 400 });

  const ids = Array.isArray(body.serviceIds)
    ? body.serviceIds.filter((x): x is string => typeof x === 'string').slice(0, 12)
    : [];
  if (!ids.length) return NextResponse.json({ ok: false, error: 'services' }, { status: 400 });

  try {
    const content = await getContent();
    const settings = content.booking;

    // Resolve ids against the catalogue, prices come from the server, never
    // from the request body.
    const chosen = content.services.filter((s) => ids.includes(s.id));
    if (!chosen.length) {
      return NextResponse.json({ ok: false, error: 'services' }, { status: 400 });
    }
    const services = chosen.map((s) => toBookedService(s, locale));

    // Venue, with the same pinning rules the form applies.
    let venue: BookedVenue = body.venue === 'home' ? 'home' : 'shop';
    if (!settings.shopOpen) venue = 'home';
    if (chosen.some((s) => (s.venue ?? 'both') === 'shop')) venue = 'shop';
    else if (chosen.some((s) => (s.venue ?? 'both') === 'home')) venue = 'home';

    const address = venue === 'home' ? cleanMultiline(body.address, 400) : '';
    if (venue === 'home' && !address) {
      return NextResponse.json({ ok: false, error: 'address' }, { status: 400 });
    }

    const area: BookingArea = body.area === 'outside' ? 'outside' : 'inside';
    const travelFee = venue === 'home' && area === 'outside' ? settings.travelFee : 0;

    const date = clean(body.date, 10);
    const time = clean(body.time, 5);
    const durationNeeded = services.reduce((sum, s) => sum + s.duration, 0) || 30;

    if (!isBookableSlot(settings, date, time, durationNeeded)) {
      return NextResponse.json({ ok: false, error: 'slot' }, { status: 400 });
    }
    if (await isSlotTaken(date, time)) {
      return NextResponse.json({ ok: false, error: 'slot_taken' }, { status: 409 });
    }

    // Promo, revalidated here against the server-side subtotal.
    const subtotalOnly = computeTotals(services, 0, 0).subtotal;
    const requestedCode = cleanPromoCode(body.promoCode);
    const promo = requestedCode ? await validatePromoCode(requestedCode, subtotalOnly) : null;
    const discount = promo?.ok ? (promo.discount ?? 0) : 0;

    const totals = computeTotals(services, travelFee, discount);
    const deposit = stripeConfigured() ? depositFor(totals.total, settings) : 0;
    const wantsToPay = body.payNow === true || settings.depositRequired;
    const payable = deposit > 0 && wantsToPay;

    const ref = makeBookingRef();
    const reservation = await addReservation({
      ref,
      name,
      phone,
      services,
      duration: totals.duration,
      subtotal: totals.subtotal,
      travelFee: totals.travelFee,
      discount: totals.discount,
      promoCode: promo?.ok ? (promo.code ?? '') : '',
      total: totals.total,
      depositDue: payable ? deposit : 0,
      paymentStatus: 'unpaid',
      date,
      time,
      notes: cleanMultiline(body.notes, 600),
      venue,
      address,
      area,
      locale
    });

    // Claim the promo use now that we have a booking to attach it to. If the
    // last use was taken by someone else in between, drop the discount rather
    // than honour a code that no longer has any left.
    let finalTotals = totals;
    let lowUsesWarning = '';
    if (promo?.ok && promo.code) {
      const claim = await redeemPromoCode(promo.code, reservation.id, discount);
      if (!claim.ok) {
        finalTotals = computeTotals(services, travelFee, 0);
        await addReservationCorrection(reservation.id, finalTotals.total);
      } else if (claim.remaining !== null && claim.remaining <= LOW_USES_THRESHOLD) {
        lowUsesWarning =
          claim.remaining === 0
            ? `\n\n⚠️ Promo code ${escapeHtml(promo.code)} has now been fully used.`
            : `\n\n⚠️ Promo code ${escapeHtml(promo.code)} has only ${claim.remaining} use(s) left.`;
      }
    }

    // Notify the shop. A Telegram outage must never fail a booking.
    const lines = [
      '<b>New booking</b>',
      `Ref: <b>${escapeHtml(ref)}</b>`,
      `Name: ${escapeHtml(name)}`,
      `Phone: ${escapeHtml(phone)}`,
      `Services: ${escapeHtml(services.map((s) => s.name).join(', '))}`,
      `When: ${escapeHtml(formatDateLong(date, 'en'))} at ${escapeHtml(formatSlot(time, 'en'))}`,
      `Where: ${venue === 'home' ? `Home visit, ${escapeHtml(address)}` : 'At the shop'}`,
      finalTotals.travelFee > 0 ? `Travel fee: ${formatAED(finalTotals.travelFee)}` : '',
      finalTotals.discount > 0
        ? `Promo ${escapeHtml(promo?.code ?? '')}: −${formatAED(finalTotals.discount)}`
        : '',
      `Total: <b>${formatAED(finalTotals.total)}</b>`,
      payable ? `Deposit requested: ${formatAED(deposit)}` : 'Paying at the shop',
      cleanMultiline(body.notes, 300) ? `Notes: ${escapeHtml(cleanMultiline(body.notes, 300))}` : ''
    ].filter(Boolean);

    await sendTelegramMessage(lines.join('\n') + lowUsesWarning);

    return NextResponse.json({
      ok: true,
      ref,
      depositDue: payable ? deposit : 0,
      payable
    });
  } catch (err) {
    console.error('[api/reserve] failed:', err);
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }
}

/** Strip a discount that could not be claimed after all. */
async function addReservationCorrection(id: string, total: number): Promise<void> {
  const { supabase } = await import('@/lib/supabase');
  const { error } = await supabase()
    .from('reservations')
    .update({ discount: 0, promo_code: '', total })
    .eq('id', id);
  if (error) console.error('[api/reserve] failed to clear unclaimed discount:', error.message);
}
