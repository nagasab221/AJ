import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import {
  deleteReservation,
  listReservations,
  supabaseConfigured,
  updateReservationStatus
} from '@/lib/db';
import { clean } from '@/lib/sanitize';
import { RESERVATION_STATUSES, type ReservationStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: true, reservations: [] });
  }

  try {
    return NextResponse.json({ ok: true, reservations: await listReservations() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load bookings.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const body = (await request.json()) as { id?: unknown; status?: unknown };
    const id = clean(body.id, 64);
    const status = clean(body.status, 20) as ReservationStatus;

    if (!id || !RESERVATION_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
    }

    const done = await updateReservationStatus(id, status);
    return NextResponse.json({ ok: done }, { status: done ? 200 : 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const body = (await request.json()) as { id?: unknown };
    const id = clean(body.id, 64);
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });

    const done = await deleteReservation(id);
    return NextResponse.json({ ok: done }, { status: done ? 200 : 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not delete.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
