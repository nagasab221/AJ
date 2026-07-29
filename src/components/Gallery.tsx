import { useTranslations } from 'next-intl';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { InstagramIcon } from '@/components/Icons';
import { cx } from '@/lib/utils';
import { t as pick, type GalleryItem, type Locale } from '@/lib/types';

/**
 * Work gallery. Arch-topped frames on a staggered baseline, the same motif as
 * the hero, repeated small. Scrolls horizontally on phones so it never becomes
 * a wall of images to swipe past.
 */
export default function Gallery({
  items,
  instagram,
  locale
}: {
  items: GalleryItem[];
  instagram: string;
  locale: Locale;
}) {
  const t = useTranslations('gallery');
  if (!items.length) return null;

  return (
    <section id="gallery" className="linen-weave bg-linen py-24 md:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading num="02" eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
          {instagram ? (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline btn-sm"
            >
              <InstagramIcon className="h-4 w-4" />
              {t('instagram')}
            </a>
          ) : null}
        </div>
      </div>

      {/* Rail on mobile, staggered grid from md up. */}
      <div className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6 md:mx-auto md:grid md:max-w-content md:grid-cols-3 md:gap-8 md:overflow-visible lg:grid-cols-6">
        {items.slice(0, 6).map((item, i) => (
          <Reveal
            key={item.id}
            delay={i * 70}
            className={cx(
              'w-[74vw] shrink-0 snap-start sm:w-[46vw] md:w-auto',
              // Stagger every other frame down a little on wide screens.
              'lg:col-span-2',
              i % 2 === 1 && 'lg:mt-14'
            )}
          >
            <figure className="group">
              <div className="arch-sm overflow-hidden border border-dune-dark bg-paper transition-transform duration-500 ease-soft group-hover:-translate-y-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={pick(item.caption, locale)}
                  className="aspect-[4/5] w-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-4 flex items-center gap-2.5 text-[0.82rem] text-stone">
                <span className="h-px w-5 bg-terracotta" />
                {pick(item.caption, locale)}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
