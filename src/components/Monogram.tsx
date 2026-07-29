import { cx } from '@/lib/utils';

type Tone = 'palm' | 'contrast' | 'terracotta';

const TONES: Record<Tone, string> = {
  palm: 'border-palm/35 text-palm',
  // For use on the always-dark surfaces (footer, reviews band).
  contrast: 'border-contrast-ink/40 text-contrast-ink',
  terracotta: 'border-terracotta/40 text-terracotta'
};

const TEXT_TONES: Record<Tone, string> = {
  palm: 'text-charcoal',
  contrast: 'text-contrast-ink',
  terracotta: 'text-charcoal'
};

const SUB_TONES: Record<Tone, string> = {
  palm: 'text-stone',
  contrast: 'text-contrast-ink/65',
  terracotta: 'text-stone'
};

/**
 * The AJ mark: the initials inside the keyhole arch that runs through the whole
 * site. Built from HTML rather than an SVG path so it uses the real display
 * face and scales with font-size.
 */
export default function Monogram({
  className,
  tone = 'palm',
  bare = false
}: {
  className?: string;
  tone?: Tone;
  bare?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        'arch-sm inline-flex items-center justify-center leading-none transition-colors duration-300',
        !bare && 'border',
        TONES[tone],
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
  tone?: Tone;
  subtitle?: string;
}) {
  return (
    <span className={cx('group inline-flex items-center gap-3', className)}>
      <Monogram
        tone={tone}
        className="h-11 w-9 text-[1.6rem] transition-transform duration-500 ease-soft group-hover:-translate-y-0.5"
      />
      <span className="flex flex-col leading-none">
        <span className={cx('font-display text-[1.45rem] tracking-tight', TEXT_TONES[tone])}>AJ</span>
        {subtitle ? (
          <span
            className={cx(
              'mt-1 text-[0.6rem] font-semibold uppercase tracking-wide3',
              SUB_TONES[tone]
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
