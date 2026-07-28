import type { Locale } from '@/lib/types';

/** Join class names, dropping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Digits-only phone for wa.me links. */
export function whatsappLink(number: string, text?: string): string {
  const digits = (number || '').replace(/\D/g, '');
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${query}`;
}

export function defaultWhatsappGreeting(locale: Locale): string {
  return locale === 'ar'
    ? 'مرحباً AJ، أريد حجز موعد.'
    : 'Hi AJ, I would like to book an appointment.';
}

/** "AED 120" — Western digits in both languages so prices are never ambiguous. */
export function formatAED(amount: number, locale: Locale = 'en'): string {
  const n = Math.round(amount * 100) / 100;
  const digits = Number.isInteger(n) ? 0 : 2;
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-AE-u-nu-latn' : 'en-AE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: 2
  }).format(n);
  return locale === 'ar' ? `${formatted} درهم` : `AED ${formatted}`;
}

/** Booking reference: 6 unambiguous characters, e.g. "AJ-7K4M2P" → "7K4M2P". */
const REF_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function makeBookingRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return out;
}

/** Promo code generator for the admin panel: 8 characters, same alphabet. */
export function makePromoCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return out;
}

/** Stable id for CMS collection items (services, gallery, testimonials). */
export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

/** Google Maps directions link for the location section. */
export function directionsLink(lat: number, lng: number, mapsUrl?: string): string {
  if (mapsUrl) return mapsUrl;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Embeddable map iframe src that needs no API key. */
export function mapEmbedSrc(lat: number, lng: number): string {
  const d = 0.008;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}
