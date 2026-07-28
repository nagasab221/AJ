import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import AnnouncementBanner, { BannerDismissScript } from '@/components/AnnouncementBanner';
import About from '@/components/About';
import BookingProvider from '@/components/booking/BookingProvider';
import BookingSection from '@/components/booking/BookingSection';
import Contact from '@/components/Contact';
import FloatingCTA from '@/components/FloatingCTA';
import Footer from '@/components/Footer';
import Gallery from '@/components/Gallery';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import LocationSection from '@/components/LocationSection';
import Services from '@/components/Services';
import Testimonials from '@/components/Testimonials';
import Ticker from '@/components/Ticker';

import { getBanner, getContent } from '@/lib/db';
import { stripeConfigured } from '@/lib/stripe';
import { dayKeyOf, dubaiTodayISO } from '@/lib/booking';
import { isAppLocale } from '@/i18n/routing';
import { t as pick, type Locale } from '@/lib/types';

// Content is edited in /admin and must show up on the next request, so nothing
// here is prerendered.
export const dynamic = 'force-dynamic';

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const [content, banner, t] = await Promise.all([
    getContent(),
    getBanner(),
    getTranslations({ locale, namespace: 'hero' })
  ]);

  const loc = locale as Locale;
  const { site, booking, location, services, gallery, testimonials } = content;

  // "Open today until 22:00" / "Closed today", from the working hours.
  const todayHours = booking.workingHours.find((h) => h.day === dayKeyOf(dubaiTodayISO()));
  const openLabel =
    todayHours && !todayHours.closed && todayHours.open && todayHours.close
      ? `${t('openToday')} · ${todayHours.open}–${todayHours.close}`
      : t('closedToday');

  // "Fades from …" should quote a real haircut, not the cheapest add-on.
  const headline = services.filter((s) => s.category !== 'addon');
  const fromPrice = headline.length ? Math.min(...headline.map((s) => s.price)) : 0;

  return (
    <>
      {/* Runs before the bar is parsed, so a dismissed banner never flashes. */}
      <BannerDismissScript version={banner.version} />
      <AnnouncementBanner banner={banner} locale={loc} />

      <Header locale={loc} tagline={pick(site.tagline, loc)} />

      <main>
        <Hero site={site} locale={loc} openLabel={openLabel} fromPrice={fromPrice} />
        <Ticker services={services} locale={loc} />

        {/* Selecting a service anywhere on the page feeds the same booking basket. */}
        <BookingProvider>
          <About site={site} locale={loc} />
          <Gallery items={gallery} instagram={site.instagram} locale={loc} />
          <Services services={services} locale={loc} />
          <BookingSection
            services={services}
            settings={booking}
            whatsapp={site.whatsapp}
            locale={loc}
            stripeEnabled={stripeConfigured()}
          />
        </BookingProvider>

        <Testimonials items={testimonials} locale={loc} />
        <LocationSection location={location} booking={booking} phone={site.phone} locale={loc} />
        <Contact site={site} locale={loc} />
      </main>

      <Footer site={site} booking={booking} locale={loc} />
      <FloatingCTA whatsapp={site.whatsapp} locale={loc} />
    </>
  );
}
