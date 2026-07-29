import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { setReservationPaymentStatus, upsertPayment } from '@/lib/db';
import { verifyWebhook } from '@/lib/stripe';
import { escapeHtml, sendTelegramMessage } from '@/lib/telegram';
import { formatAED } from '@/lib/utils';
import type { PaymentStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Stripe → us. This is the only place a booking is marked paid: the browser
 * saying "it worked" is a UI hint, the webhook is the record.
 *
 * Stripe retries on any non-2xx, so failures here are recoverable.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const event = await verifyWebhook(raw, request.headers.get('stripe-signature'));

  if (!event) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await record(event.data.object as Stripe.PaymentIntent, 'paid', true);
        break;

      case 'payment_intent.payment_failed':
        await record(event.data.object as Stripe.PaymentIntent, 'failed', false);
        break;

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const intentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (intentId) {
          await upsertPayment({
            reservationId: (charge.metadata?.reservation_id as string) || '',
            amount: (charge.amount_refunded ?? 0) / 100,
            status: 'refunded',
            stripePaymentId: intentId
          });
          const reservationId = charge.metadata?.reservation_id as string | undefined;
          if (reservationId) await setReservationPaymentStatus(reservationId, 'refunded');
        }
        break;
      }

      default:
        // Everything else is noise for this integration.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[api/payments/webhook] handler failed:', err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

async function record(
  intent: Stripe.PaymentIntent,
  status: PaymentStatus,
  notify: boolean
): Promise<void> {
  const reservationId = (intent.metadata?.reservation_id as string) || '';
  const amount = (intent.amount ?? 0) / 100;

  await upsertPayment({
    reservationId,
    amount,
    status,
    stripePaymentId: intent.id
  });

  if (reservationId) await setReservationPaymentStatus(reservationId, status);

  if (notify) {
    await sendTelegramMessage(
      [
        '<b>Deposit paid</b>',
        `Ref: <b>${escapeHtml((intent.metadata?.ref as string) || '-')}</b>`,
        `Name: ${escapeHtml((intent.metadata?.customer_name as string) || '-')}`,
        `Amount: ${formatAED(amount)}`
      ].join('\n')
    );
  }
}
