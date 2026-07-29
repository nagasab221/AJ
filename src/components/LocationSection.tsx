import { useTranslations } from 'next-intl';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { ClockIcon, HomeIcon, MapPinIcon, PhoneIcon, ArrowRightIcon } from '@/components/Icons';
import { directionsLink, formatAED, mapEmbedSrc } from '@/lib/utils';
import { DAY_KEYS, t as pick, type BookingSettings, type Locale, type LocationInfo } from '@/lib/types';
import { dayKeyOf, displayTime, dubaiTodayISO } from '@/lib/booking';

const DAY_LABELS: Record<string, { en: string; ar: string }> = {
  sunday: { en: 'Sunday', ar: 'الأحد' },
  monday: { en: 'Monday', ar: 'الاثنين' },
  tuesday: { en: 'Tuesday', ar: 'الثلاثاء' },
  wednesday: { en: 'Wednesday', ar: 'الأربعاء' },
  thursday: { en: 'Thursday', ar: 'الخميس' },
  friday: { en: 'Friday', ar: 'الجمعة' },
  saturday: { en: 'Saturday', ar: 'السبت' }
};

export default function LocationSection({
  location,
  booking,
  phone,
  locale
}: {
  location: LocationInfo;
  booking: BookingSettings;
  phone: string;
  locale: Locale;
}) {
  const t = useTranslations('location');
  const today = dayKeyOf(dubaiTodayISO());

  return (
    <section id="location" className="bg-paper py-24 md:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading num="06" eyebrow={t('eyebrow')} title={t('title')} />

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Details */}
          <Reveal className="lg:col-span-5">
            <div className="space-y-8">
              <div className="flex gap-4">
                <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <h3 className="text-[0.75rem] font-semibold uppercase tracking-wide2 text-stone">
                    {t('title')}
                  </h3>
                  <p className="mt-2 text-[1.05rem] leading-relaxed text-charcoal">
                    {pick(location.address, locale)}
                  </p>
                  <a
                    href={directionsLink(location.lat, location.lng, location.mapsUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-[0.9rem] font-semibold text-palm underline decoration-dune-deep underline-offset-8 hover:text-terracotta"
                  >
                    {t('directions')}
                    <ArrowRightIcon className="h-4 w-4 flip-rtl" />
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <h3 className="text-[0.75rem] font-semibold uppercase tracking-wide2 text-stone">
                    {t('phone')}
                  </h3>
                  <a
                    href={`tel:${phone}`}
                    dir="ltr"
                    className="mt-2 block text-[1.05rem] text-charcoal hover:text-palm"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[0.75rem] font-semibold uppercase tracking-wide2 text-stone">
                    {t('hours')}
                  </h3>
                  <dl className="mt-3 divide-y divide-dune">
                    {DAY_KEYS.map((day) => {
                      const hours = booking.workingHours.find((h) => h.day === day);
                      const isToday = day === today;
                      return (
                        <div
                          key={day}
                          className={`flex items-center justify-between gap-4 py-2 text-[0.95rem] ${
                            isToday ? 'font-semibold text-charcoal' : 'text-stone'
                          }`}
                        >
                          <dt className="flex items-center gap-2">
                            {DAY_LABELS[day][locale]}
                            {isToday ? (
                              <span className="badge-soft text-[0.6rem]">{t('today')}</span>
                            ) : null}
                          </dt>
                          <dd dir="ltr">
                            {!hours || hours.closed || !hours.open || !hours.close
                              ? locale === 'ar'
                                ? 'مغلق'
                                : 'Closed'
                              : `${displayTime(hours.open)} – ${displayTime(hours.close)}`}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Map + home visits */}
          <Reveal delay={100} className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-dune-dark bg-linen shadow-soft">
              <iframe
                title={t('mapTitle')}
                src={mapEmbedSrc(location.lat, location.lng)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[22rem] w-full border-0 md:h-[26rem]"
              />
            </div>

            <div className="mt-6 flex gap-4 rounded-2xl border border-palm/25 bg-palm-mist p-6">
              <HomeIcon className="mt-0.5 h-5 w-5 shrink-0 text-palm" />
              <div>
                <h3 className="font-display text-xl text-charcoal">{t('homeVisitsTitle')}</h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-charcoal-soft">
                  {t('homeVisitsBody', {
                    area: pick(booking.areaName, locale),
                    fee: formatAED(booking.travelFee, locale)
                  })}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
