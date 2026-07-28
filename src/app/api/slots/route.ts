import { NextResponse } from 'next/server';
import { supabaseConfigured, takenSlots } from '@/lib/db';
import { isValidDateString } from '@/lib/booking';

export const dynamic = 'force-dynamic';

/** Times already spoken for on a date, so the picker can grey them out. */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? '';
  if (!isValidDateString(date)) {
    return NextResponse.json({ taken: [] });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ taken: [] });
  }

  try {
    return NextResponse.json({ taken: await takenSlots(date) });
  } catch (err) {
    console.error('[api/slots] failed:', err);
    // Failing open is right here: worst case someone picks a taken slot and
    // /api/reserve rejects it with a clear message.
    return NextResponse.json({ taken: [] });
  }
}
