/**
 * Shared types for the AJ site.
 *
 * Everything editable in /admin lives in one JSONB document (`site_content`),
 * except the three systems that need their own rows for counting and joins:
 * promo codes, the announcement banner, and payments.
 */

export type Locale = 'en' | 'ar';

/** A bilingual string. English is the fallback for both directions. */
export interface L {
  en: string;
  ar: string;
}

/** Pick the right language variant with a graceful fallback chain. */
export function t(l: Partial<L> | undefined | null, locale: Locale): string {
  if (!l) return '';
  return l[locale] || l.en || l.ar || '';
}

// ── services ────────────────────────────────────────────────────────────────

export const SERVICE_CATEGORIES = ['hair', 'beard', 'combo', 'kids', 'addon'] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/** Where a service can be performed. */
export const VENUES = ['home', 'shop', 'both'] as const;
export type Venue = (typeof VENUES)[number];
export type BookedVenue = Exclude<Venue, 'both'>;

export interface Service {
  id: string;
  name: L;
  /** AED. */
  price: number;
  /** Shown as "from AED x" when true. */
  startingFrom?: boolean;
  /** Minutes. */
  duration: number;
  description: L;
  category: ServiceCategory;
  /** Renders the "Most Booked" badge. */
  popular?: boolean;
  /** Defaults to 'both' when unset. */
  venue?: Venue;
  image?: string | null;
}

// ── site content ────────────────────────────────────────────────────────────

export interface Stat {
  value: string;
  label: L;
}

export interface SiteSettings {
  tagline: L;
  heroEyebrow: L;
  heroTitle: L;
  heroSubtitle: L;
  aboutHeading: L;
  aboutBody: L[];
  barberName: L;
  barberRole: L;
  barberBio: L;
  stats: Stat[];
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  tiktok: string;
}

export const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export interface DayHours {
  day: DayKey;
  closed?: boolean;
  /** "HH:MM" 24h. */
  open?: string;
  close?: string;
}

export interface BlockedDate {
  /** YYYY-MM-DD */
  date: string;
  reason?: string;
}

export type DepositType = 'fixed' | 'percent';

export interface BookingSettings {
  heading: L;
  subheading: L;
  workingHours: DayHours[];
  blockedDates: BlockedDate[];
  /** When false the shop option is hidden and every booking is a home visit. */
  shopOpen: boolean;
  /** Home-visit area covered with no travel fee. */
  areaName: L;
  /** AED added to a home visit outside `areaName`. */
  travelFee: number;
  /** Master switch for taking money online at all. */
  depositEnabled: boolean;
  /** 'fixed' → depositValue is AED; 'percent' → depositValue is % of the total. */
  depositType: DepositType;
  depositValue: number;
  /**
   * false → the customer may skip payment and pay at the shop (AJ's choice).
   * true  → payment is required before the booking is accepted.
   */
  depositRequired: boolean;
}

export type BookingArea = 'inside' | 'outside';

export interface LocationInfo {
  address: L;
  hoursText: L;
  lat: number;
  lng: number;
  /** Optional Google Maps place link; falls back to lat/lng directions. */
  mapsUrl?: string;
}

export interface GalleryItem {
  id: string;
  caption: L;
  /** Path under /public, or a Supabase storage URL uploaded via /admin. */
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  quote: L;
  rating: number;
}

/** Everything the public page needs, CMS-backed with per-piece fallbacks. */
export interface SiteContent {
  site: SiteSettings;
  booking: BookingSettings;
  location: LocationInfo;
  services: Service[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
}

// ── announcement banner ─────────────────────────────────────────────────────

export const BANNER_STYLES = ['palm', 'terracotta', 'charcoal'] as const;
export type BannerStyle = (typeof BANNER_STYLES)[number];

export interface BannerSettings {
  enabled: boolean;
  text: L;
  /** Optional href — "#booking", a promo anchor, or a full URL. */
  link: string;
  linkLabel: L;
  style: BannerStyle;
  /** Bumping this makes a dismissed banner reappear for everyone. */
  version: number;
  updatedAt: string;
}

// ── promo codes ─────────────────────────────────────────────────────────────

export type DiscountType = 'percent' | 'fixed';

export interface PromoCode {
  id: string;
  /** Always stored and compared upper-case. */
  code: string;
  discountType: DiscountType;
  /** Percent (1–100) or AED depending on `discountType`. */
  discountValue: number;
  /** ISO date (YYYY-MM-DD) or null for "never expires". */
  expiresAt: string | null;
  /** null = unlimited. */
  maxUses: number | null;
  usesCount: number;
  /** Minimum booking subtotal in AED, or null. */
  minAmount: number | null;
  active: boolean;
  createdAt: string;
}

/** Why a code was refused — mapped to a translated message in the UI. */
export type PromoRejection =
  | 'not_found'
  | 'inactive'
  | 'expired'
  | 'used_up'
  | 'below_minimum'
  | 'unavailable';

export interface PromoResult {
  ok: boolean;
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  /** AED actually taken off this booking. */
  discount?: number;
  reason?: PromoRejection;
  /** Set for 'below_minimum' so the UI can say how much more is needed. */
  minAmount?: number;
}

// ── payments ────────────────────────────────────────────────────────────────

export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Payment {
  id: string;
  reservationId: string;
  /** AED. */
  amount: number;
  status: PaymentStatus;
  stripePaymentId: string;
  createdAt: string;
}

// ── bookings ────────────────────────────────────────────────────────────────

export const RESERVATION_STATUSES = ['new', 'confirmed', 'completed', 'cancelled', 'no-show'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** A service as captured at booking time (prices are frozen into the booking). */
export interface BookedService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface StoredReservation {
  id: string;
  ref: string;
  name: string;
  phone: string;
  services: BookedService[];
  /** Total minutes across the booked services. */
  duration: number;
  /** AED, services only. */
  subtotal: number;
  travelFee: number;
  /** AED taken off by a promo code. */
  discount: number;
  promoCode: string;
  /** subtotal + travelFee − discount. */
  total: number;
  /** AED expected up front (0 when AJ has deposits switched off). */
  depositDue: number;
  paymentStatus: PaymentStatus;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  notes: string;
  venue: BookedVenue;
  /** Client address for home visits, empty for shop bookings. */
  address: string;
  area: BookingArea;
  locale: Locale;
  status: ReservationStatus;
  createdAt: string;
}
