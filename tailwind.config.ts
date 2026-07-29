import type { Config } from 'tailwindcss';

/**
 * Design tokens — "Desert Linen & Palm", dark by default.
 *
 * Every colour resolves to a CSS variable holding "R G B" channels, so the
 * whole site flips between themes by swapping variables on <html> rather than
 * by sprinkling dark: variants through the markup. The channel format is what
 * lets Tailwind keep supporting opacity utilities like `text-ink/60`.
 *
 * Names are semantic on purpose. `page`, `surface` and `ink` invert between
 * themes; `contrast` and `feature` are surfaces that stay dark in both, so the
 * footer and reviews band do not turn white when the light theme is on.
 */
const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Page and card surfaces
        linen: {
          DEFAULT: withOpacity('--c-page'),
          deep: withOpacity('--c-page-alt')
        },
        paper: withOpacity('--c-surface'),

        // Hairlines and dividers
        dune: {
          DEFAULT: withOpacity('--c-line'),
          dark: withOpacity('--c-line-strong'),
          deep: withOpacity('--c-line-stronger')
        },

        // Body text
        charcoal: {
          DEFAULT: withOpacity('--c-ink'),
          soft: withOpacity('--c-ink-soft')
        },
        stone: {
          DEFAULT: withOpacity('--c-muted'),
          light: withOpacity('--c-muted-soft')
        },

        // Primary accent. `palm` is readable as text AND usable as a solid
        // button background, because `text-linen` on it inverts too.
        palm: {
          DEFAULT: withOpacity('--c-accent'),
          dark: withOpacity('--c-accent-strong'),
          light: withOpacity('--c-accent-soft'),
          mist: withOpacity('--c-accent-tint')
        },

        // Secondary accent, near-constant across themes.
        terracotta: {
          DEFAULT: withOpacity('--c-warm'),
          dark: withOpacity('--c-warm-strong'),
          mist: withOpacity('--c-warm-tint')
        },

        // Always-dark surfaces (footer).
        contrast: {
          DEFAULT: withOpacity('--c-contrast'),
          ink: withOpacity('--c-on-contrast')
        },

        // The reviews / ticker band.
        feature: {
          DEFAULT: withOpacity('--c-feature'),
          line: withOpacity('--c-feature-line'),
          ink: withOpacity('--c-on-feature')
        },

        // Announcement bar, kept legible in both themes.
        banner: {
          green: withOpacity('--c-banner-green'),
          orange: withOpacity('--c-banner-orange'),
          dark: withOpacity('--c-banner-dark'),
          ink: withOpacity('--c-on-banner')
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'var(--font-body)', 'sans-serif']
      },
      letterSpacing: {
        wide2: '0.18em',
        wide3: '0.26em'
      },
      borderRadius: {
        arch: '14rem 14rem 1rem 1rem',
        'arch-sm': '7rem 7rem 0.75rem 0.75rem'
      },
      maxWidth: {
        content: '75rem'
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.05), 0 8px 28px -12px rgb(0 0 0 / 0.18)',
        lift: '0 2px 4px rgb(0 0 0 / 0.06), 0 22px 48px -20px rgb(0 0 0 / 0.34)'
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' }
        },
        'arch-grow': {
          from: { opacity: '0', transform: 'translateY(28px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        'sheen': {
          from: { transform: 'translateX(-120%)' },
          to: { transform: 'translateX(220%)' }
        }
      },
      animation: {
        'rise-in': 'rise-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 1.1s ease both',
        'soft-pulse': 'soft-pulse 1.6s ease-in-out infinite',
        'arch-grow': 'arch-grow 1.15s cubic-bezier(0.22, 1, 0.36, 1) both',
        'sheen': 'sheen 1.4s ease-in-out'
      }
    }
  },
  plugins: []
};

export default config;
