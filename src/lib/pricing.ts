/**
 * All booking money maths lives here so the running summary in the browser and
 * the authoritative recalculation on the server can never drift apart.
 * The client's numbers are only ever a preview — /api/reserve recomputes
 * everything from the stored service list before writing a booking.
 */
import type { BookedService, BookingSettings, DiscountType, Service } from '@/lib/types';

export interface Totals {
  /** Services only, AED. */
  subtotal: number;
  /** Total minutes. */
  duration: number;
  travelFee: number;
  discount: number;
  /** subtotal − discount + travelFee, never below zero. */
  total: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** AED taken off a subtotal by a discount, clamped to the subtotal itself. */
export function discountAmount(subtotal: number, type: DiscountType, value: number): number {
  if (subtotal <= 0 || value <= 0) return 0;
  const raw = type === 'percent' ? (subtotal * Math.min(value, 100)) / 100 : value;
  return round2(Math.min(raw, subtotal));
}

/**
 * Totals for a set of chosen services.
 * The promo discount applies to services only — never to the travel fee, so a
 * 100% code can't turn a home visit into a free trip across the emirate.
 */
export function computeTotals(
  services: Array<Pick<BookedService, 'price' | 'duration'>>,
  travelFee: number,
  discount: number
): Totals {
  const subtotal = round2(services.reduce((sum, s) => sum + (Number(s.price) || 0), 0));
  const duration = services.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const fee = Math.max(0, round2(Number(travelFee) || 0));
  const capped = round2(Math.min(Math.max(0, discount), subtotal));
  return {
    subtotal,
    duration,
    travelFee: fee,
    discount: capped,
    total: round2(Math.max(0, subtotal - capped + fee))
  };
}

/**
 * What the customer is asked to pay online, in AED.
 * Returns 0 when AJ has deposits switched off, when Stripe is not configured,
 * or when the maths lands below Stripe's minimum charge.
 */
export const MIN_CHARGE_AED = 2;

export function depositFor(total: number, settings: BookingSettings): number {
  if (!settings.depositEnabled) return 0;
  if (total <= 0) return 0;
  const raw =
    settings.depositType === 'percent'
      ? (total * Math.min(Math.max(settings.depositValue, 0), 100)) / 100
      : settings.depositValue;
  const amount = round2(Math.min(Math.max(raw, 0), total));
  return amount < MIN_CHARGE_AED ? 0 : amount;
}

/** Stripe takes the smallest currency unit — AED fils. */
export function toFils(aed: number): number {
  return Math.round(aed * 100);
}

/** Freeze the customer-visible name and price of a service into the booking. */
export function toBookedService(service: Service, locale: 'en' | 'ar'): BookedService {
  return {
    id: service.id,
    name: service.name[locale] || service.name.en || service.name.ar || service.id,
    price: Number(service.price) || 0,
    duration: Number(service.duration) || 0
  };
}
