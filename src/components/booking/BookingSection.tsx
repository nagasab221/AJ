'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import BookingForm from '@/components/booking/BookingForm';
import ManageBooking from '@/components/booking/ManageBooking';
import SectionHeading from '@/components/SectionHeading';
import { cx } from '@/lib/utils';
import { t as pick, type BookingSettings, type Locale, type Service } from '@/lib/types';

export default function BookingSection({
  services,
  settings,
  whatsapp,
  locale,
  stripeEnabled
}: {
  services: Service[];
  settings: BookingSettings;
  whatsapp: string;
  locale: Locale;
  stripeEnabled: boolean;
}) {
  const t = useTranslations('booking');
  const [tab, setTab] = useState<'book' | 'manage'>('book');

  return (
    <section id="booking" className="scroll-mt-24 bg-paper py-24 md:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          num="04"
          eyebrow={t('eyebrow')}
          title={pick(settings.heading, locale)}
          subtitle={pick(settings.subheading, locale)}
        />

        <div className="mt-10 flex gap-2.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'book'}
            onClick={() => setTab('book')}
            className={cx('chip', tab === 'book' && 'chip-active')}
          >
            {t('tabBook')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'manage'}
            onClick={() => setTab('manage')}
            className={cx('chip', tab === 'manage' && 'chip-active')}
          >
            {t('tabManage')}
          </button>
        </div>

        <div className="mt-10">
          {tab === 'book' ? (
            <BookingForm
              services={services}
              settings={settings}
              whatsapp={whatsapp}
              locale={locale}
              stripeEnabled={stripeEnabled}
            />
          ) : (
            <ManageBooking settings={settings} locale={locale} />
          )}
        </div>
      </div>
    </section>
  );
}
