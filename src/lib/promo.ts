/**
 * Promo code validation.
 *
 * The customer's browser calls /api/promo/validate for instant feedback, but
 * that answer is only a preview: /api/reserve re-runs exactly the same checks
 * server-side and then claims the use atomically, so a code can never be
 * stretched past its limits by editing the request.
 */
import { dubaiTodayISO } from '@/lib/booking';
import { findPromoByCode } from '@/lib/db';
import { discountAmount } from '@/lib/pricing';
import type { PromoCode, PromoResult } from '@/lib/types';

/** Pure check — no I/O, so the same rules can run anywhere. */
export function evaluatePromo(
  promo: PromoCode | null,
  subtotal: number,
  todayISO: string
): PromoResult {
  if (!promo) return { ok: false, reason: 'not_found' };
  if (!promo.active) return { ok: false, reason: 'inactive' };
  if (promo.expiresAt && promo.expiresAt < todayISO) return { ok: false, reason: 'expired' };
  if (promo.maxUses !== null && promo.usesCount >= promo.maxUses) {
    return { ok: false, reason: 'used_up' };
  }
  if (promo.minAmount !== null && subtotal < promo.minAmount) {
    return { ok: false, reason: 'below_minimum', minAmount: promo.minAmount };
  }

  return {
    ok: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discount: discountAmount(subtotal, promo.discountType, promo.discountValue)
  };
}

/** Look the code up and evaluate it against a subtotal. */
export async function validatePromoCode(code: string, subtotal: number): Promise<PromoResult> {
  if (!code) return { ok: false, reason: 'not_found' };
  try {
    const promo = await findPromoByCode(code);
    return evaluatePromo(promo, subtotal, dubaiTodayISO());
  } catch (err) {
    console.error('[promo] lookup failed:', err);
    return { ok: false, reason: 'unavailable' };
  }
}

/** Is a code worth warning AJ about because it is nearly exhausted? */
export const LOW_USES_THRESHOLD = 3;

export function remainingUses(promo: Pick<PromoCode, 'maxUses' | 'usesCount'>): number | null {
  return promo.maxUses === null ? null : Math.max(0, promo.maxUses - promo.usesCount);
}
