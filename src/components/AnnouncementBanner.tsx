'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CloseIcon, ArrowRightIcon } from '@/components/Icons';
import { cx } from '@/lib/utils';
import { t as pick, type BannerSettings, type Locale } from '@/lib/types';

/** Session key, includes the version so bumping it re-shows a dismissed bar. */
export function bannerKey(version: number): string {
  return `aj_banner_dismissed_v${version}`;
}

/**
 * The announcement bar sits above the header. When AJ switches it off the
 * server renders nothing at all, so no empty space is left behind.
 *
 * Dismissal is per session (sessionStorage): it stays gone while the tab is
 * open and comes back on the visitor's next visit. The blocking script in the
 * layout hides an already-dismissed bar before first paint, so there is no
 * flash and no layout shift, this component only handles the click.
 */
export default function AnnouncementBanner({
  banner,
  locale
}: {
  banner: BannerSettings;
  locale: Locale;
}) {
  const t = useTranslations('banner');
  const [dismissed, setDismissed] = useState(false);

  if (!banner.enabled || dismissed) return null;

  const text = pick(banner.text, locale);
  if (!text) return null;

  const linkLabel = pick(banner.linkLabel, locale);
  // Fixed banner colours rather than theme tokens: the bar is a deliberate
  // accent strip and must stay legible whichever theme is on.
  const tones = {
    palm: 'bg-banner-green text-banner-ink',
    terracotta: 'bg-banner-orange text-banner-ink',
    charcoal: 'bg-banner-dark text-banner-ink'
  } as const;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(bannerKey(banner.version), '1');
      document.documentElement.removeAttribute('data-banner');
    } catch {
      // Private mode with storage disabled, closing for this render is enough.
    }
  }

  return (
    <div id="announcement" className={cx('relative z-50', tones[banner.style])}>
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2.5 sm:px-6">
        <p className="flex-1 text-center text-[0.88rem] font-medium leading-snug">
          {text}
          {banner.link && linkLabel ? (
            <a
              href={banner.link}
              className="ms-2 inline-flex items-center gap-1 font-bold underline decoration-1 underline-offset-4 hover:opacity-80"
            >
              {linkLabel}
              <ArrowRightIcon className="h-3.5 w-3.5 flip-rtl" />
            </a>
          ) : null}
        </p>

        <button
          type="button"
          onClick={dismiss}
          aria-label={t('dismiss')}
          className="-me-1 shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/15"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Runs before first paint: if this visitor already closed this version of the
 * bar in this session, hide it via CSS so it never flashes into view.
 */
export function BannerDismissScript({ version }: { version: number }) {
  const js = `try{if(sessionStorage.getItem(${JSON.stringify(
    bannerKey(version)
  )})){document.documentElement.setAttribute('data-banner','off')}}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
