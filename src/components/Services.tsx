'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import SectionHeading from '@/components/SectionHeading';
import { useBooking } from '@/components/booking/BookingProvider';
import { CheckIcon, ClockIcon, HomeIcon, PlusIcon, StoreIcon } from '@/components/Icons';
import { cx, formatAED } from '@/lib/utils';
import { formatDuration } from '@/lib/booking';
import { SERVICE_CATEGORIES, t as pick, type Locale, type Service, type ServiceCategory } from '@/lib/types';

type Filter = 'all' | ServiceCategory;

export default function Services({ services, locale }: { services: Service[]; locale: Locale }) {
  const t = useTranslations('services');
  const c = useTranslations('common');
  const { isSelected, toggle } = useBooking();
  const [filter, setFilter] = useState<Filter>('all');

  // Only offer tabs for categories that actually have services.
  const available = useMemo(
    () => SERVICE_CATEGORIES.filter((cat) => services.some((s) => s.category === cat)),
    [services]
  );

  const shown = useMemo(
    () => (filter === 'all' ? services : services.filter((s) => s.category === filter)),
    [services, filter]
  );

  return (
    <section id="services" className="bg-linen-deep py-24 md:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading num="03" eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

        {/* Category tabs */}
        <div
          role="tablist"
          aria-label={t('eyebrow')}
          className="no-scrollbar mt-12 flex gap-2.5 overflow-x-auto pb-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={cx('chip shrink-0', filter === 'all' && 'chip-active')}
          >
            {t('all')}
          </button>
          {available.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={filter === cat}
              onClick={() => setFilter(cat)}
              className={cx('chip shrink-0', filter === cat && 'chip-active')}
            >
              {t(cat)}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="mt-12 text-stone">{t('empty')}</p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((service) => {
              const picked = isSelected(service.id);
              const venue = service.venue ?? 'both';

              return (
                <li key={service.id}>
                  <article
                    className={cx(
                      'flex h-full flex-col rounded-2xl border bg-paper p-6 transition-all duration-300 ease-soft',
                      picked
                        ? 'border-palm shadow-lift ring-1 ring-palm/20'
                        : 'border-dune hover:border-dune-deep hover:shadow-soft'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="badge-soft">{t(service.category)}</span>
                          {service.popular ? (
                            <span className="badge-popular">{t('mostBooked')}</span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 font-display text-[1.6rem] leading-tight text-charcoal">
                          {pick(service.name, locale)}
                        </h3>
                      </div>

                      <div className="shrink-0 text-end">
                        {service.startingFrom ? (
                          <span className="block text-[0.68rem] uppercase tracking-wide2 text-stone">
                            {c('from')}
                          </span>
                        ) : null}
                        <span className="font-display text-[1.7rem] leading-none text-palm">
                          {formatAED(service.price, locale)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 flex-1 text-[0.96rem] leading-relaxed text-stone">
                      {pick(service.description, locale)}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.82rem] text-stone">
                      <span className="inline-flex items-center gap-1.5">
                        <ClockIcon className="h-4 w-4" />
                        {formatDuration(service.duration, locale)}
                      </span>
                      {venue === 'shop' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <StoreIcon className="h-4 w-4" />
                          {t('shopOnly')}
                        </span>
                      ) : null}
                      {venue === 'home' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <HomeIcon className="h-4 w-4" />
                          {t('homeOnly')}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggle(service.id)}
                      aria-pressed={picked}
                      className={cx('mt-6 w-full', picked ? 'btn-quiet' : 'btn-outline')}
                    >
                      {picked ? (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          {t('added')}
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4" />
                          {t('add')}
                        </>
                      )}
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
