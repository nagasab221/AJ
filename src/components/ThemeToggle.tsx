'use client';

import { useEffect, useState } from 'react';
import { cx } from '@/lib/utils';

export const THEME_KEY = 'aj_theme';

type Theme = 'dark' | 'light';

/**
 * Dark is the default. The choice is remembered in localStorage and applied by
 * the blocking script below before first paint, so switching themes never
 * flashes the wrong one on the next page load.
 */
export default function ThemeToggle({ labels }: { labels: { toDark: string; toLight: string } }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'light' : 'dark');
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode with storage blocked: the switch still works for this page.
    }
  }

  const goingLight = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={goingLight ? labels.toLight : labels.toDark}
      title={goingLight ? labels.toLight : labels.toDark}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-dune-dark text-charcoal transition-colors duration-300 hover:border-palm hover:text-palm"
    >
      {/* Both icons are rendered and cross-faded, so the button never jumps. */}
      <span className="relative block h-[18px] w-[18px]">
        <SunIcon
          className={cx(
            'absolute inset-0 h-[18px] w-[18px] transition-all duration-500 ease-soft',
            mounted && goingLight ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
          )}
        />
        <MoonIcon
          className={cx(
            'absolute inset-0 h-[18px] w-[18px] transition-all duration-500 ease-soft',
            mounted && !goingLight ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
          )}
        />
      </span>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.4 8.4 0 1 0 9.4 9.4z" />
    </svg>
  );
}

/**
 * Applies the saved theme before the page paints. Rendered in <head> so it runs
 * ahead of any content and cannot cause a flash of the wrong theme.
 */
export function ThemeScript() {
  const js = `try{var t=localStorage.getItem(${JSON.stringify(
    THEME_KEY
  )});document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
