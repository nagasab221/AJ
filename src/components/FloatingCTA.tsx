'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { WhatsAppIcon } from '@/components/Icons';
import { cx, defaultWhatsappGreeting, whatsappLink } from '@/lib/utils';
import type { Locale } from '@/lib/types';

/**
 * Phone-only sticky bar. Appears once the hero is out of the way and hides
 * again while the booking section is on screen, so it never covers the form
 * the visitor is trying to fill in.
 */
export default function FloatingCTA({ whatsapp, locale }: { whatsapp: string; locale: Locale }) {
  const t = useTranslations('nav');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const booking = document.getElementById('booking');

    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.8;
      let overBooking = false;
      if (booking) {
        const rect = booking.getBoundingClientRect();
        overBooking = rect.top < window.innerHeight && rect.bottom > 0;
      }
      setVisible(past && !overBooking);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className={cx(
        'fixed inset-x-0 bottom-0 z-40 border-t border-dune bg-linen/95 px-4 py-3 backdrop-blur-md transition-transform duration-500 ease-soft sm:hidden',
        visible ? 'translate-y-0' : 'translate-y-full'
      )}
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3">
        <a href="#booking" className="btn-palm flex-1">
          {t('bookNow')}
        </a>
        <a
          href={whatsappLink(whatsapp, defaultWhatsappGreeting(locale))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="btn-outline w-14 px-0"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
