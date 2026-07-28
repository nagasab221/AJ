'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CheckIcon, CloseIcon, TagIcon } from '@/components/Icons';
import { cx, formatAED } from '@/lib/utils';
import type { Locale, PromoResult } from '@/lib/types';

const REASON_KEYS: Record<string, string> = {
  not_found: 'notFound',
  inactive: 'inactive',
  expired: 'expired',
  used_up: 'usedUp',
  below_minimum: 'belowMinimum',
  unavailable: 'unavailable'
};

/**
 * "Have a promo code?" — checks the code against the live subtotal and reports
 * the discount immediately. The answer here is only a preview; /api/reserve
 * revalidates and claims the use when the booking is actually saved.
 */
export default function PromoField({
  subtotal,
  applied,
  onApply,
  onClear,
  locale
}: {
  subtotal: number;
  applied: PromoResult | null;
  onApply: (result: PromoResult) => void;
  onClear: () => void;
  locale: Locale;
}) {
  const t = useTranslations('promo');
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  async function check(event: React.SyntheticEvent) {
    event.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || checking) return;

    setChecking(true);
    setError('');

    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, subtotal })
      });
      const data = (await res.json()) as PromoResult;

      if (data.ok) {
        onApply(data);
        setCode('');
      } else {
        const key = REASON_KEYS[data.reason ?? 'unavailable'] ?? 'unavailable';
        setError(
          key === 'belowMinimum'
            ? t('belowMinimum', { min: formatAED(data.minAmount ?? 0, locale) })
            : t(key as 'notFound')
        );
      }
    } catch {
      setError(t('unavailable'));
    } finally {
      setChecking(false);
    }
  }

  if (applied?.ok) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-palm/35 bg-palm-mist px-4 py-3.5">
        <CheckIcon className="h-5 w-5 shrink-0 text-palm" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.92rem] font-semibold text-palm">
            {t('applied', { code: applied.code ?? '' })}
          </p>
          <p className="text-[0.85rem] text-charcoal-soft">
            {t('savedYou', { amount: formatAED(applied.discount ?? 0, locale) })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-full p-1.5 text-stone transition-colors hover:bg-white/60 hover:text-terracotta-dark"
          aria-label={t('remove')}
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="label flex items-center gap-2" htmlFor="promo-code">
        <TagIcon className="h-4 w-4 text-terracotta" />
        {t('label')}
      </label>

      <div className="flex gap-2">
        <input
          id="promo-code"
          name="promo"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            // The promo box lives inside the booking form — Enter must not
            // submit the whole booking.
            if (e.key === 'Enter') {
              e.preventDefault();
              void check(e);
            }
          }}
          placeholder={t('placeholder')}
          autoComplete="off"
          spellCheck={false}
          dir="ltr"
          maxLength={32}
          className={cx('field flex-1 font-semibold uppercase tracking-wide2', error && 'field-error')}
        />
        <button
          type="button"
          onClick={check}
          disabled={checking || !code.trim()}
          className="btn-outline shrink-0"
        >
          {checking ? t('checking') : t('apply')}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-[0.86rem] font-semibold text-terracotta-dark">{error}</p>
      ) : null}
    </div>
  );
}
