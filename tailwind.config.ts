import type { Config } from 'tailwindcss';

/**
 * Design tokens — "Desert Linen & Palm".
 *
 * A light, warm identity: linen and dune neutrals, a deep palm-green primary
 * and a terracotta secondary. Deliberately shares nothing with the MJ site
 * (ink / cream / brass on black) — different hues, different type, different
 * motif (the keyhole arch instead of pinstripes and a wax seal).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        linen: {
          DEFAULT: '#F7F3EB',
          deep: '#F1EBDF'
        },
        paper: '#FFFCF6',
        dune: {
          DEFAULT: '#E7DCC9',
          dark: '#D9CBB2',
          deep: '#C7B698'
        },
        palm: {
          DEFAULT: '#2E4A3B',
          dark: '#22382C',
          light: '#3E6350',
          mist: '#E6EDE8'
        },
        terracotta: {
          DEFAULT: '#C4703F',
          dark: '#A85A2E',
          mist: '#F6E7DB'
        },
        charcoal: {
          DEFAULT: '#1C1F1C',
          soft: '#3A423B'
        },
        // Muted body text that still clears WCAG AA on linen.
        stone: {
          DEFAULT: '#5C6459',
          light: '#7C8479'
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
        // The signature motif: a keyhole arch.
        arch: '14rem 14rem 1rem 1rem',
        'arch-sm': '7rem 7rem 0.75rem 0.75rem'
      },
      maxWidth: {
        content: '75rem'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,31,28,0.04), 0 8px 28px -12px rgba(28,31,28,0.14)',
        lift: '0 2px 4px rgba(28,31,28,0.05), 0 22px 48px -20px rgba(28,31,28,0.28)'
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'ticker-ltr': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' }
        },
        'ticker-rtl': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(50%)' }
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' }
        }
      },
      animation: {
        'rise-in': 'rise-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        'ticker-ltr': 'ticker-ltr 38s linear infinite',
        'ticker-rtl': 'ticker-rtl 38s linear infinite',
        'soft-pulse': 'soft-pulse 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
