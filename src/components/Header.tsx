'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Wordmark } from '@/components/Monogram';
import { CloseIcon, MenuIcon } from '@/components/Icons';
import { cx } from '@/lib/utils';
import type { Locale } from '@/lib/types';

const LINKS = [
  { href: '#about', key: 'about' },
  { href: '#services', key: 'services' },
  { href: '#gallery', key: 'gallery' },
  { href: '#reviews', key: 'reviews' },
  { href: '#location', key: 'location' }
] as const;

export default function Header({ locale, tagline }: { locale: Locale; tagline: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Never leave the mobile sheet open behind a navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Lock background scrolling while the sheet is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  const otherHref = pathname.replace(/^\/(en|ar)/, `/${other}`) || `/${other}`;

  return (
    <header
      className={cx(
        'sticky top-0 z-40 transition-all duration-500 ease-soft',
        scrolled ? 'border-b border-dune bg-linen/95 backdrop-blur-md' : 'border-b border-transparent'
      )}
      style={{ height: 'var(--header-h)' }}
    >
      <div className="mx-auto flex h-full max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${locale}`} aria-label="AJ" className="shrink-0">
          <Wordmark subtitle={tagline} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-[0.9rem] font-semibold text-charcoal-soft transition-colors duration-200 hover:text-palm"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={otherHref}
            hrefLang={other}
            className="rounded-full border border-dune-dark px-3.5 py-2 text-[0.78rem] font-bold text-charcoal transition-colors hover:border-palm hover:text-palm"
          >
            {other === 'ar' ? t('switchToArabic') : t('switchToEnglish')}
          </Link>

          <a href="#booking" className="btn-palm btn-sm hidden sm:inline-flex">
            {t('bookNow')}
          </a>

          <button
            type="button"
            className="rounded-full border border-dune-dark p-2.5 text-charcoal lg:hidden"
            aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('closeMenu')}
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 max-h-[92vh] overflow-y-auto rounded-b-3xl border-b border-dune bg-linen px-6 pb-8 pt-5 shadow-lift">
            <div className="flex items-center justify-between">
              <Wordmark subtitle={tagline} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t('closeMenu')}
                className="rounded-full border border-dune-dark p-2.5 text-charcoal"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-7 flex flex-col">
              {LINKS.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-dune py-4 font-display text-2xl text-charcoal"
                >
                  {t(link.key)}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className="border-b border-dune py-4 font-display text-2xl text-charcoal"
              >
                {t('contact')}
              </a>
            </nav>

            <a
              href="#booking"
              onClick={() => setMenuOpen(false)}
              className="btn-palm mt-7 w-full"
            >
              {t('bookNow')}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
