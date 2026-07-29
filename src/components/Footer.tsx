import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Wordmark } from '@/components/Monogram';
import { InstagramIcon, MailIcon, PhoneIcon, TikTokIcon, WhatsAppIcon } from '@/components/Icons';
import { displayTime } from '@/lib/booking';
import { defaultWhatsappGreeting, whatsappLink } from '@/lib/utils';
import { DAY_KEYS, t as pick, type BookingSettings, type Locale, type SiteSettings } from '@/lib/types';

const DAY_SHORT: Record<string, { en: string; ar: string }> = {
  sunday: { en: 'Sun', ar: 'الأحد' },
  monday: { en: 'Mon', ar: 'الاثنين' },
  tuesday: { en: 'Tue', ar: 'الثلاثاء' },
  wednesday: { en: 'Wed', ar: 'الأربعاء' },
  thursday: { en: 'Thu', ar: 'الخميس' },
  friday: { en: 'Fri', ar: 'الجمعة' },
  saturday: { en: 'Sat', ar: 'السبت' }
};

const LINKS = ['about', 'services', 'gallery', 'booking', 'reviews', 'location', 'contact'] as const;

export default function Footer({
  site,
  booking,
  locale
}: {
  site: SiteSettings;
  booking: BookingSettings;
  locale: Locale;
}) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-contrast text-contrast-ink">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* Identity */}
          <div className="md:col-span-4">
            <Wordmark tone="contrast" subtitle={pick(site.tagline, locale)} />
            <p className="mt-6 max-w-xs text-[0.95rem] leading-relaxed text-contrast-ink/65">
              {pick(site.heroSubtitle, locale)}
            </p>

            <div className="mt-7 flex items-center gap-3">
              {site.instagram ? (
                <a
                  href={site.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="arch-sm flex h-11 w-10 items-center justify-center border border-contrast-ink/25 text-contrast-ink/80 transition-colors hover:border-terracotta hover:text-terracotta"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              ) : null}
              {site.tiktok ? (
                <a
                  href={site.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="arch-sm flex h-11 w-10 items-center justify-center border border-contrast-ink/25 text-contrast-ink/80 transition-colors hover:border-terracotta hover:text-terracotta"
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>
              ) : null}
              <a
                href={whatsappLink(site.whatsapp, defaultWhatsappGreeting(locale))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="arch-sm flex h-11 w-10 items-center justify-center border border-contrast-ink/25 text-contrast-ink/80 transition-colors hover:border-terracotta hover:text-terracotta"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav className="md:col-span-3">
            <h2 className="text-[0.72rem] font-semibold uppercase tracking-wide2 text-contrast-ink/50">
              {t('quickLinks')}
            </h2>
            <ul className="mt-5 space-y-3">
              {LINKS.map((key) => (
                <li key={key}>
                  <a
                    href={`#${key}`}
                    className="text-[0.95rem] text-contrast-ink/80 transition-colors hover:text-terracotta"
                  >
                    {nav(key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hours */}
          <div className="md:col-span-3">
            <h2 className="text-[0.72rem] font-semibold uppercase tracking-wide2 text-contrast-ink/50">
              {t('hours')}
            </h2>
            <dl className="mt-5 space-y-2.5 text-[0.92rem]">
              {DAY_KEYS.map((day) => {
                const hours = booking.workingHours.find((h) => h.day === day);
                return (
                  <div key={day} className="flex items-center justify-between gap-3">
                    <dt className="text-contrast-ink/65">{DAY_SHORT[day][locale]}</dt>
                    <dd dir="ltr" className="text-contrast-ink/85">
                      {!hours || hours.closed || !hours.open || !hours.close
                        ? locale === 'ar'
                          ? 'مغلق'
                          : 'Closed'
                        : `${displayTime(hours.open)}–${displayTime(hours.close)}`}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <h2 className="text-[0.72rem] font-semibold uppercase tracking-wide2 text-contrast-ink/50">
              {t('contact')}
            </h2>
            <ul className="mt-5 space-y-4 text-[0.92rem]">
              <li>
                <a
                  href={`tel:${site.phone}`}
                  dir="ltr"
                  className="inline-flex items-center gap-2 text-contrast-ink/80 hover:text-terracotta"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  dir="ltr"
                  className="inline-flex items-center gap-2 break-all text-contrast-ink/80 hover:text-terracotta"
                >
                  <MailIcon className="h-4 w-4" />
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-contrast-ink/15 pt-7 text-[0.82rem] text-contrast-ink/55 sm:flex-row">
          <p>
            © {year} AJ. {t('rights')}
          </p>
          <div className="flex items-center gap-5">
            <span>{t('builtBy')}</span>
            <Link href="/admin" className="transition-colors hover:text-terracotta">
              {t('adminLink')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
