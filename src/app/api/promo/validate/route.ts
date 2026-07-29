import { NextResponse } from 'next/server';
import { cleanPromoCode, cleanNumber } from '@/lib/sanitize';
import { supabaseConfigured } from '@/lib/db';
import { validatePromoCode } from '@/lib/promo';
import type { PromoResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Live check for the "Have a promo code?" field.
 *
 * This is a preview only, the discount is recalculated and the use is claimed
 * atomically in /api/reserve, so a tampered response here buys nothing.
 */
export async function POST(request: Request) {
  let body: { code?: unknown; subtotal?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json<PromoResult>({ ok: false, reason: 'not_found' }, { status: 400 });
  }

  const code = cleanPromoCode(body.code);
  const subtotal = cleanNumber(body.subtotal, { min: 0, max: 100000 });

  if (!code) {
    return NextResponse.json<PromoResult>({ ok: false, reason: 'not_found' });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json<PromoResult>({ ok: false, reason: 'unavailable' });
  }

  return NextResponse.json<PromoResult>(await validatePromoCode(code, subtotal));
}
