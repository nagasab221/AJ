import { NextResponse } from 'next/server';
import { findReservation, supabaseConfigured, upsertPayment } from '@/lib/db';
import { normalizeUAEPhone } from '@/lib/booking';
import { toFils } from '@/lib/pricing';
import { clean } from '@/lib/sanitize';
import { stripeClient, stripeConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * Creates the PaymentIntent for a booking's deposit.
 *
 * The amount comes from the stored booking, never from the request, so the
 * browser cannot ask to be charged less. Ownership is proved with the same
 * reference + phone pair used by the manage-booking flow.
 *
 * automatic_payment_methods is what makes Apple Pay and Google Pay appear in
 * the Payment Element on devices that support them, with card as the fallback.
 */
export async function POST(request: Request) {
  if (!stripeConfigured() || !supabaseConfigured()) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  let body: { ref?: unknown; phone?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const ref = clean(body.ref, 12).toUpperCase();
  const phone = normalizeUAEPhone(clean(body.phone, 24));
  if (!ref || !phone) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  try {
    const booking = await findReservation(ref, phone);
    if (!booking) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (booking.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'already_paid' }, { status: 409 });
    }

    const amount = booking.depositDue > 0 ? booking.depositDue : booking.total;
    if (amount <= 0) return NextResponse.json({ error: 'nothing_due' }, { status: 400 });

    const intent = await stripeClient().paymentIntents.create({
      amount: toFils(amount),
      currency: 'aed',
      automatic_payment_methods: { enabled: true },
      description: `AJ booking ${ref}`,
      metadata: {
        reservation_id: booking.id,
        ref: booking.ref,
        customer_name: booking.name
      }
    });

    if (!intent.client_secret) {
      return NextResponse.json({ error: 'stripe' }, { status: 502 });
    }

    await upsertPayment({
      reservationId: booking.id,
      amount,
      status: 'unpaid',
      stripePaymentId: intent.id
    });

    return NextResponse.json({ clientSecret: intent.client_secret, amount });
  } catch (err) {
    console.error('[api/payments/intent] failed:', err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
