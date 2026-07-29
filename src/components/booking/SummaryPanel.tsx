'use client';

import { useTranslations } from 'next-intl';
import { CloseIcon } from '@/components/Icons';
import { formatDuration } from '@/lib/booking';
import { formatAED } from '@/lib/utils';
import type { BookedService, Locale } from '@/lib/types';
import type { Totals } from '@/lib/pricing';

/**
 * The running "Your booking" panel. Sticky beside the form on desktop, and
 * repeated inline above the confirm step on phones.
 */
export default function SummaryPanel({
  services,
  totals,
  deposit,
  locale,
  onRemove,
  compact = false
}: {
  services: BookedService[];
  totals: Totals;
  deposit: number;
  locale: Locale;
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  const t = useTranslations('booking');

  return (
    <aside
      className={compact ? 'rounded-2xl border border-dune-dark bg-linen p-5' : 'card p-6'}
      aria-live="polite"
    >
      <h3 className="font-display text-xl text-charcoal">{t('summary')}</h3>

      {services.length === 0 ? (
        <p className="mt-4 text-[0.95rem] text-stone">{t('summaryEmpty')}</p>
      ) : (
        <>
          <ul className="mt-5 space-y-3">
            {services.map((service) => (
              <li key={service.id} className="flex items-start justify-between gap-3 text-[0.95rem]">
                <div className="min-w-0">
                  <p className="text-charcoal">{service.name}</p>
                  <p className="text-[0.82rem] text-stone">
                    {formatDuration(service.duration, locale)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-charcoal">
                    {formatAED(service.price, locale)}
                  </span>
                  {onRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemove(service.id)}
                      className="rounded-full p-1 text-stone-light transition-colors hover:bg-dune/60 hover:text-terracotta-dark"
                      aria-label={`${service.name}, ${t('summaryServices')}`}
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2.5 border-t border-dune pt-5 text-[0.92rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-stone">{t('summaryTime')}</dt>
              <dd className="text-charcoal">{formatDuration(totals.duration, locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">{t('summarySubtotal')}</dt>
              <dd className="text-charcoal">{formatAED(totals.subtotal, locale)}</dd>
            </div>
            {totals.travelFee > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-stone">{t('summaryTravel')}</dt>
                <dd className="text-charcoal">+{formatAED(totals.travelFee, locale)}</dd>
              </div>
            ) : null}
            {totals.discount > 0 ? (
              <div className="flex justify-between gap-3 font-semibold text-palm">
                <dt>{t('summaryDiscount')}</dt>
                <dd>−{formatAED(totals.discount, locale)}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-5 flex items-baseline justify-between gap-3 border-t-2 border-charcoal/15 pt-5">
            <span className="text-[0.8rem] font-semibold uppercase tracking-wide2 text-stone">
              {t('summaryTotal')}
            </span>
            <span className="font-display text-[2rem] leading-none text-palm">
              {formatAED(totals.total, locale)}
            </span>
          </div>

          {deposit > 0 ? (
            <div className="mt-4 rounded-xl bg-palm-mist px-4 py-3 text-[0.88rem]">
              <div className="flex justify-between gap-3 font-semibold text-palm">
                <span>{t('summaryDeposit')}</span>
                <span>{formatAED(deposit, locale)}</span>
              </div>
              {totals.total - deposit > 0 ? (
                <div className="mt-1 flex justify-between gap-3 text-charcoal-soft">
                  <span>{t('summaryAtShop')}</span>
                  <span>{formatAED(totals.total - deposit, locale)}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
}
