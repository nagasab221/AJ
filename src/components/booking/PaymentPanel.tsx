'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Appearance, type Stripe } from '@stripe/stripe-js';
import { AlertIcon, CardIcon } from '@/components/Icons';
import { formatAED } from '@/lib/utils';
import type { Locale } from '@/lib/types';

/**
 * Stripe deposit step.
 *
 * The Payment Element is used rather than a bare card field precisely because
 * it surfaces Apple Pay and Google Pay as one-tap options on devices that
 * support them, and falls back to a card form everywhere else.
 *
 * The booking is already saved before this renders, so abandoning payment
 * costs the customer nothing — they simply pay at the shop instead.
 */

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

/** Match the Payment Element to the site rather than shipping Stripe's default blue. */
function appearanceFor(): Appearance {
  return {
    theme: 'flat',
    variables: {
      colorPrimary: '#2E4A3B',
      colorBackground: '#FFFCF6',
      colorText: '#1C1F1C',
      colorDanger: '#A85A2E',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '12px',
      spacingUnit: '4px'
    },
    rules: {
      '.Input': { border: '1px solid #D9CBB2', boxShadow: 'none', padding: '12px' },
      '.Input:focus': { border: '1px solid #2E4A3B', boxShadow: '0 0 0 3px rgba(46,74,59,0.18)' },
      '.Label': { fontWeight: '600', color: '#5C6459' },
      '.Tab': { border: '1px solid #D9CBB2' },
      '.Tab--selected': { border: '1px solid #2E4A3B', color: '#2E4A3B' }
    }
  };
}

function PayForm({
  amount,
  locale,
  onPaid,
  onSkip
}: {
  amount: number;
  locale: Locale;
  onPaid: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations('payment');
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || busy) return;

    setBusy(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Cards and wallets that don't need a redirect finish inline; only the
      // ones that genuinely require a bank page will navigate away.
      redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}${window.location.pathname}#booking` }
    });

    if (stripeError) {
      setError(stripeError.message || t('failed'));
      setBusy(false);
      return;
    }

    if (paymentIntent && ['succeeded', 'processing'].includes(paymentIntent.status)) {
      onPaid();
      return;
    }

    setError(t('failed'));
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error ? (
        <p className="flex items-start gap-2 text-[0.9rem] font-semibold text-terracotta-dark">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={!stripe || busy} className="btn-palm w-full">
        {busy ? t('processing') : t('paySubmit', { amount: formatAED(amount, locale) })}
      </button>

      <button type="button" onClick={onSkip} className="btn-outline w-full">
        {t('payLater')}
      </button>

      <p className="text-center text-[0.78rem] text-stone-light">{t('securedBy')}</p>
    </form>
  );
}

export default function PaymentPanel({
  bookingRef,
  phone,
  amount,
  locale,
  onPaid,
  onSkip
}: {
  bookingRef: string;
  phone: string;
  amount: number;
  locale: Locale;
  onPaid: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations('payment');
  const [clientSecret, setClientSecret] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/payments/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref: bookingRef, phone })
        });
        const data = (await res.json()) as { clientSecret?: string };
        if (cancelled) return;
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setFailed(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingRef, phone]);

  const options = useMemo(
    () => ({ clientSecret, appearance: appearanceFor(), locale: locale as 'en' | 'ar' }),
    [clientSecret, locale]
  );

  if (failed) {
    return (
      <div className="rounded-2xl border border-dune-dark bg-linen p-6">
        <p className="flex items-start gap-2 text-[0.95rem] text-charcoal">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
          {t('unavailable')}
        </p>
        <button type="button" onClick={onSkip} className="btn-outline mt-5 w-full">
          {t('payLater')}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dune-dark bg-paper p-6">
      <h3 className="flex items-center gap-2 font-display text-xl text-charcoal">
        <CardIcon className="h-5 w-5 text-palm" />
        {t('heading')}
      </h3>
      <p className="mt-2 text-[0.92rem] text-stone">{t('payNowHint')}</p>

      <div className="mt-6">
        {clientSecret ? (
          <Elements stripe={getStripe()} options={options}>
            <PayForm amount={amount} locale={locale} onPaid={onPaid} onSkip={onSkip} />
          </Elements>
        ) : (
          <div className="space-y-3" aria-busy>
            <div className="h-12 animate-soft-pulse rounded-xl bg-dune/60" />
            <div className="h-12 animate-soft-pulse rounded-xl bg-dune/40" />
            <div className="h-12 animate-soft-pulse rounded-xl bg-dune/30" />
          </div>
        )}
      </div>
    </div>
  );
}
