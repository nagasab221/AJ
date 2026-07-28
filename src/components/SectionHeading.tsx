import { cx } from '@/lib/utils';

/**
 * Every section opens the same way: a numeral, a hairline that runs to the
 * edge, then the eyebrow and title. The numeral + rule is the layout rhythm
 * that ties the page together.
 */
export default function SectionHeading({
  num,
  eyebrow,
  title,
  subtitle,
  align = 'start',
  tone = 'dark',
  className
}: {
  num: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const centered = align === 'center';

  return (
    <div
      className={cx(
        'flex flex-col',
        centered ? 'items-center text-center' : 'items-start text-start',
        className
      )}
    >
      <div className={cx('flex w-full items-center gap-4', centered && 'justify-center')}>
        <span className={cx('section-num', tone === 'light' && 'text-dune')}>{num}</span>
        <span
          className={cx(
            'h-px flex-1 max-w-[7rem]',
            tone === 'light' ? 'bg-linen/25' : 'bg-dune-dark'
          )}
        />
        <span className={cx('eyebrow', tone === 'light' && 'text-linen/70')}>{eyebrow}</span>
      </div>

      <h2
        className={cx(
          'mt-5 max-w-2xl text-[2.1rem] leading-[1.08] md:text-[3rem]',
          tone === 'light' ? 'text-linen' : 'text-charcoal'
        )}
      >
        {title}
      </h2>

      {subtitle ? (
        <p
          className={cx(
            'mt-4 max-w-xl text-[1.02rem] leading-relaxed',
            tone === 'light' ? 'text-linen/75' : 'text-stone'
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
