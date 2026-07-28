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
    <section id="reviews" className="bg-palm py-24 md:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading num="05" eyebrow={t('eyebrow')} title={t('title')} align="center" tone="light" />

        <ul className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item, i) => (
            <Reveal as="li" key={item.id} delay={i * 80}>
              <figure className="flex h-full flex-col rounded-2xl border border-palm-light bg-palm-dark/40 p-7">
                <div
                  className="flex gap-1 text-terracotta"
                  aria-label={t('ratingLabel', { rating: item.rating })}
                >
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} className="h-4 w-4" filled={s < item.rating} />
                  ))}
                </div>

                <blockquote className="mt-5 flex-1 text-[1.02rem] leading-relaxed text-linen/90">
                  {pick(item.quote, locale)}
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-palm-light/60 pt-5">
                  <span className="arch-sm flex h-9 w-8 items-center justify-center border border-dune/40 font-display text-sm text-dune">
                    {item.name.slice(0, 1)}
                  </span>
                  <span className="text-[0.9rem] font-semibold text-linen">{item.name}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
