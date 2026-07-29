import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { IBM_Plex_Sans_Arabic, Karla, Playfair_Display } from 'next/font/google';

import { ThemeScript } from '@/components/ThemeToggle';
import { isAppLocale } from '@/i18n/routing';
import '@/app/globals.css';

/**
 * Type pairing:
 *   Playfair Display     high-contrast serif for headings
 *   Karla                humanist body copy with a little character
 *   IBM Plex Sans Arabic the Arabic counterpart, matched for x-height
 */
const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap'
});

const body = Karla({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap'
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(SITE_URL),
    title: t('title'),
    description: t('description'),
    icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', ar: '/ar' }
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}`,
      siteName: 'AJ',
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description')
    }
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme="dark"
      className={`${display.variable} ${body.variable} ${arabic.variable}`}
    >
      <head>
        {/* Applies the saved theme before first paint, so no flash of the wrong one. */}
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
