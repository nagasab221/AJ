import { useTranslations } from 'next-intl';
import Monogram from '@/components/Monogram';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { InstagramIcon } from '@/components/Icons';
import { t as pick, type Locale, type SiteSettings } from '@/lib/types';

export default function About({ site, locale }: { site: SiteSettings; locale: Locale }) {
  const t = useTranslations('about');

  return (
    <section id="about" className="bg-paper py-24 md:py-32">
      <div className="mx-auto grid max-w-content grid-cols-1 gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16">
        {/* Portrait + stats */}
        <Reveal className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-[20rem] lg:mx-0">
            <div aria-hidden className="arch absolute -bottom-4 -start-4 h-full w-full border border-terracotta/45" />
            <div className="arch relative overflow-hidden border border-dune-dark bg-terracotta-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/work-2.svg" alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" />
            </div>
            <div className="absolute -bottom-5 end-2 rounded-2xl border border-dune-dark bg-paper px-4 py-2.5 shadow-soft">
              <span className="font-display text-lg text-charcoal">{pick(site.barberName, locale)}</span>
              <span className="block text-[0.7rem] font-semibold uppercase tracking-wide2 text-stone">
                {pick(site.barberRole, locale)}
              </span>
            </div>
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8">
            {site.stats.map((stat) => (
              <div key={pick(stat.label, locale)} className="border-t border-dune pt-4">
                <dt className="text-[0.72rem] font-semibold uppercase tracking-wide2 text-stone">
                  {pick(stat.label, locale)}
                </dt>
                <dd className="mt-1 font-display text-[2.2rem] leading-none text-palm">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Copy */}
        <Reveal delay={120} className="lg:col-span-7">
          <SectionHeading num="01" eyebrow={t('eyebrow')} title={pick(site.aboutHeading, locale)} />

          <div className="mt-8 space-y-6 text-[1.05rem] leading-relaxed text-stone">
            {site.aboutBody.map((para, i) => (
              <p key={i}>{pick(para, locale)}</p>
            ))}
          </div>

          {/* Pull quote — the bio, given weight rather than buried in a caption. */}
          <figure className="relative mt-12 border-s-2 border-palm ps-7">
            <Monogram className="absolute -top-2 end-0 hidden h-16 w-14 text-[2.4rem] opacity-15 sm:flex" />
            <blockquote className="font-display text-[1.55rem] leading-snug text-charcoal">
              {pick(site.barberBio, locale)}
            </blockquote>
            <figcaption className="mt-4 text-[0.8rem] font-semibold uppercase tracking-wide2 text-stone">
              {pick(site.barberName, locale)} — {pick(site.barberRole, locale)}
            </figcaption>
          </figure>

          {site.instagram ? (
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2 text-[0.9rem] font-semibold text-palm underline decoration-dune-deep underline-offset-8 transition-colors hover:text-terracotta"
            >
              <InstagramIcon className="h-4 w-4" />
              {t('instagram')}
            </a>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
