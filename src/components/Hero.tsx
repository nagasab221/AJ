import { useTranslations } from 'next-intl';
import Monogram from '@/components/Monogram';
import { ChevronDownIcon, StarIcon, WhatsAppIcon } from '@/components/Icons';
import { whatsappLink, defaultWhatsappGreeting, formatAED } from '@/lib/utils';
import { t as pick, type Locale, type SiteSettings } from '@/lib/types';

/**
 * The hero: type stack on the start side, the keyhole arch holding the portrait
 * on the end side, and a deliberate column of empty linen between them.
 * Sits at 88vh so the ticker below is visible without scrolling — the page
 * should feel like it continues, not like a full-screen splash.
 */
export default function Hero({
  site,
  locale,
  openLabel,
  fromPrice
}: {
  site: SiteSettings;
  locale: Locale;
  openLabel: string;
  fromPrice: number;
}) {
  const t = useTranslations('hero');

  return (
    <section
      id="top"
      className="linen-weave relative overflow-hidden bg-linen"
      style={{ minHeight: 'calc(88svh - var(--header-h))' }}
    >
      {/* Oversized ghost arch — the motif, used once at scale. */}
      <div
        aria-hidden
        className="arch pointer-events-none absolute -top-24 end-[-14%] h-[46rem] w-[34rem] border border-dune-dark/40 opacity-70 lg:end-[6%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-linen-deep"
      />

      <div className="relative mx-auto grid max-w-content grid-cols-1 items-center gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-24">
        {/* Type stack */}
        <div className="lg:col-span-7 xl:col-span-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-terracotta" />
            <p className="eyebrow text-terracotta">{pick(site.heroEyebrow, locale)}</p>
          </div>

          <h1 className="mt-6 max-w-[15ch] text-[3rem] leading-[0.98] text-charcoal sm:text-[4rem] lg:text-[4.6rem]">
            {pick(site.heroTitle, locale)}
          </h1>

          <p className="mt-7 max-w-lg text-[1.05rem] leading-relaxed text-stone">
            {pick(site.heroSubtitle, locale)}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#booking" className="btn-palm w-full sm:w-auto">
              {t('bookNow')}
            </a>
            <a
              href={whatsappLink(site.whatsapp, defaultWhatsappGreeting(locale))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full sm:w-auto"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {t('whatsapp')}
            </a>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[0.85rem] text-stone">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-palm animate-soft-pulse" />
              {openLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <StarIcon className="h-4 w-4 text-terracotta" />
              <strong className="font-semibold text-charcoal">4.9</strong>
              <span className="text-stone-light">·</span>
              {t('homeVisits')}
            </span>
          </div>
        </div>

        {/* The arch */}
        <div className="relative lg:col-span-5 xl:col-span-6">
          <div className="relative mx-auto w-full max-w-[22rem] lg:ms-auto lg:me-0">
            {/* Dune ring sitting behind, offset so the arch reads as layered. */}
            <div
              aria-hidden
              className="arch absolute -bottom-4 -end-4 h-full w-full bg-dune"
            />
            <div className="arch relative overflow-hidden border border-dune-dark bg-palm-mist shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/work-1.svg"
                alt=""
                className="aspect-[4/5] w-full object-cover"
                loading="eager"
              />
            </div>

            {/* Price chip overlapping the arch edge. */}
            <div className="absolute -bottom-6 start-0 flex items-center gap-3 rounded-2xl border border-dune-dark bg-paper px-4 py-3 shadow-soft">
              <Monogram className="h-10 w-8 text-[1.4rem]" />
              <span className="flex flex-col leading-tight">
                <span className="text-[0.68rem] font-semibold uppercase tracking-wide2 text-stone">
                  {locale === 'ar' ? 'تبدأ من' : 'Fades from'}
                </span>
                <strong className="font-display text-xl text-charcoal">
                  {formatAED(fromPrice, locale)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-5 start-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-stone transition-colors hover:text-palm lg:flex"
      >
        <span className="text-[0.62rem] uppercase tracking-wide3">{t('scroll')}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </a>
    </section>
  );
}
