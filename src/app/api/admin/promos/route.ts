import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import {
  createPromoCode,
  deletePromoCode,
  listPromoCodes,
  supabaseConfigured,
  updatePromoCode
} from '@/lib/db';
import { clean, cleanNumber, cleanPromoCode } from '@/lib/sanitize';
import type { DiscountType } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  if (!supabaseConfigured()) return NextResponse.json({ ok: true, promos: [] });

  try {
    return NextResponse.json({ ok: true, promos: await listPromoCodes() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load promo codes.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const code = cleanPromoCode(body.code);
    if (code.length < 3) {
      return NextResponse.json(
        { ok: false, error: 'A code needs at least 3 letters or numbers.' },
        { status: 400 }
      );
    }

    const discountType: DiscountType = body.discountType === 'fixed' ? 'fixed' : 'percent';
    const discountValue = cleanNumber(body.discountValue, {
      min: 0,
      max: discountType === 'percent' ? 100 : 100000
    });
    if (discountValue <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Enter how much the discount is worth.' },
        { status: 400 }
      );
    }

    const expires = clean(body.expiresAt, 10);
    const maxUsesRaw = clean(body.maxUses, 10);
    const minAmountRaw = clean(body.minAmount, 12);

    const promo = await createPromoCode({
      code,
      discountType,
      discountValue,
      expiresAt: DATE_RE.test(expires) ? expires : null,
      maxUses: maxUsesRaw ? cleanNumber(maxUsesRaw, { min: 1, max: 100000, round: true }) : null,
      minAmount: minAmountRaw ? cleanNumber(minAmountRaw, { min: 0, max: 100000 }) : null,
      active: body.active !== false
    });

    return NextResponse.json({ ok: true, promo });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create the code.';
    if (message === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { ok: false, error: 'That code already exists. Try another one.' },
        { status: 409 }
      );
    }
    console.error('[admin/promos] create failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const body = (await request.json()) as { id?: unknown; active?: unknown };
    const id = clean(body.id, 64);
    if (!id || typeof body.active !== 'boolean') {
      return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
    }

    const done = await updatePromoCode(id, { active: body.active });
    return NextResponse.json({ ok: done }, { status: done ? 200 : 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update the code.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const body = (await request.json()) as { id?: unknown };
    const id = clean(body.id, 64);
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });

    const done = await deletePromoCode(id);
    return NextResponse.json({ ok: done }, { status: done ? 200 : 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not delete the code.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
