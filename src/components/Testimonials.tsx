import { useTranslations } from 'next-intl';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { StarIcon } from '@/components/Icons';
import { t as pick, type Locale, type Testimonial } from '@/lib/types';

export default function Testimonials({
  items,
  locale
}: {
  items: Testimonial[];
  locale: Locale;
}) {
  const t = useTranslations('testimonials');
  if (!items.length) return null;

  return (
    <section id="reviews" className="bg-feature py-24 md:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading num="05" eyebrow={t('eyebrow')} title={t('title')} align="center" tone="light" />

        <ul className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item, i) => (
            <Reveal as="li" key={item.id} delay={i * 80}>
              <figure className="hover-lift flex h-full flex-col rounded-2xl border border-feature-line bg-feature-ink/[0.04] p-7">
                <div
                  className="flex gap-1 text-terracotta"
                  aria-label={t('ratingLabel', { rating: item.rating })}
                >
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} className="h-4 w-4" filled={s < item.rating} />
                  ))}
                </div>

                <blockquote className="mt-5 flex-1 text-[1.02rem] leading-relaxed text-feature-ink/90">
                  {pick(item.quote, locale)}
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-feature-line pt-5">
                  <span className="arch-sm flex h-9 w-8 items-center justify-center border border-feature-ink/30 font-display text-sm text-feature-ink/80">
                    {item.name.slice(0, 1)}
                  </span>
                  <span className="text-[0.9rem] font-semibold text-feature-ink">{item.name}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
