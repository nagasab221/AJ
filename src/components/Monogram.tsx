import { cx } from '@/lib/utils';

/**
 * The AJ mark: the initials set inside the keyhole arch that runs through the
 * whole site. Deliberately built from HTML rather than an SVG path so it uses
 * the real display face and scales with font-size.
 */
export default function Monogram({
  className,
  tone = 'palm',
  bare = false
}: {
  className?: string;
  tone?: 'palm' | 'linen' | 'terracotta';
  bare?: boolean;
}) {
  const tones = {
    palm: 'border-palm/35 text-palm',
    linen: 'border-linen/40 text-linen',
    terracotta: 'border-terracotta/40 text-terracotta'
  };

  return (
    <span
      aria-hidden
      className={cx(
        'arch-sm inline-flex items-center justify-center leading-none',
        !bare && 'border',
        tones[tone],
        className
      )}
    >
      <span className="font-display tracking-[-0.04em]" style={{ fontSize: '0.62em' }}>
        AJ
      </span>
    </span>
  );
}

/** Wordmark for the header and footer: the arch mark plus the name. */
export function Wordmark({
  className,
  tone = 'palm',
  subtitle
}: {
  className?: string;
  tone?: 'palm' | 'linen' | 'terracotta';
  subtitle?: string;
}) {
  return (
    <span className={cx('inline-flex items-center gap-3', className)}>
      <Monogram tone={tone} className="h-11 w-9 text-[1.6rem]" />
      <span className="flex flex-col leading-none">
        <span
          className={cx(
            'font-display text-[1.45rem] tracking-tight',
            tone === 'linen' ? 'text-linen' : 'text-charcoal'
          )}
        >
          AJ
        </span>
        {subtitle ? (
          <span
            className={cx(
              'mt-1 text-[0.6rem] font-semibold uppercase tracking-wide3',
              tone === 'linen' ? 'text-linen/65' : 'text-stone'
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
