/**
 * Data layer, backed by Supabase.
 *
 *   site_content       one JSONB row (id 'main') holding all editable copy,
 *                      seeded from fallback-content.json on first load
 *   reservations       submitted bookings (the /admin inbox)
 *   promo_codes        discount codes + their usage counters
 *   promo_redemptions  which booking used which code
 *   banner_settings    one row (id 'main') for the announcement bar
 *   payments           Stripe payment records, one per booking attempt
 *   storage 'uploads'  images uploaded from /admin
 *
 * Everything runs server-side with the service-role key. When Supabase is not
 * configured the public site falls back to built-in demo content and writes
 * fail loudly so the admin UI can surface the problem.
 */
import fallbackJson from '@/lib/fallback-content.json';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type {
  BannerSettings,
  BookingSettings,
  Payment,
  PaymentStatus,
  PromoCode,
  ReservationStatus,
  SiteContent,
  StoredReservation
} from '@/lib/types';

export { supabaseConfigured, uploadsPublicPrefix } from '@/lib/supabase';

export const FALLBACK = fallbackJson as unknown as SiteContent;

const CONTENT_ROW_ID = 'main';
const BANNER_ROW_ID = 'main';

// ── content ─────────────────────────────────────────────────────────────────

/** Merge stored content with fallbacks so a missing piece never breaks a page. */
function normalizeContent(raw: Partial<SiteContent> | null): SiteContent {
  if (!raw) return FALLBACK;
  const fb = FALLBACK.booking;
  const booking: BookingSettings = {
    heading: raw.booking?.heading ?? fb.heading,
    subheading: raw.booking?.subheading ?? fb.subheading,
    workingHours: raw.booking?.workingHours?.length ? raw.booking.workingHours : fb.workingHours,
    blockedDates: raw.booking?.blockedDates ?? [],
    shopOpen: raw.booking?.shopOpen ?? fb.shopOpen,
    areaName: raw.booking?.areaName ?? fb.areaName,
    travelFee: raw.booking?.travelFee ?? fb.travelFee,
    depositEnabled: raw.booking?.depositEnabled ?? fb.depositEnabled,
    depositType: raw.booking?.depositType ?? fb.depositType,
    depositValue: raw.booking?.depositValue ?? fb.depositValue,
    depositRequired: raw.booking?.depositRequired ?? fb.depositRequired
  };
  return {
    site: { ...FALLBACK.site, ...raw.site },
    booking,
    location: { ...FALLBACK.location, ...raw.location },
    services: raw.services?.length ? raw.services : FALLBACK.services,
    gallery: raw.gallery?.length ? raw.gallery : FALLBACK.gallery,
    testimonials: raw.testimonials?.length ? raw.testimonials : FALLBACK.testimonials
  };
}

export async function getContent(): Promise<SiteContent> {
  if (!supabaseConfigured()) return FALLBACK;
  try {
    const { data, error } = await supabase()
      .from('site_content')
      .select('content')
      .eq('id', CONTENT_ROW_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.content) return normalizeContent(data.content as Partial<SiteContent>);

    // First run: seed the row with the starter content.
    const { error: seedError } = await supabase()
      .from('site_content')
      .upsert({ id: CONTENT_ROW_ID, content: FALLBACK, updated_at: new Date().toISOString() });
    if (seedError) console.error('[db] failed to seed site_content:', seedError.message);
    return FALLBACK;
  } catch (err) {
    console.error('[db] getContent failed, serving fallback:', err);
    return FALLBACK;
  }
}

/** Throws on failure — callers surface the error in the admin UI. */
export async function saveContent(content: SiteContent): Promise<void> {
  const { error } = await supabase()
    .from('site_content')
    .upsert({ id: CONTENT_ROW_ID, content, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

// ── announcement banner ─────────────────────────────────────────────────────

export const DEFAULT_BANNER: BannerSettings = {
  enabled: false,
  text: {
    en: 'Eid offer — 20% off every fade with code EID20',
    ar: 'عرض العيد — خصم ٢٠٪ على كل قصة بكود EID20'
  },
  link: '#booking',
  linkLabel: { en: 'Book now', ar: 'احجز الآن' },
  style: 'palm',
  version: 1,
  updatedAt: new Date(0).toISOString()
};

interface BannerRow {
  enabled: boolean;
  text: BannerSettings['text'];
  link: string;
  link_label: BannerSettings['linkLabel'];
  style: string;
  version: number;
  updated_at: string;
}

export async function getBanner(): Promise<BannerSettings> {
  if (!supabaseConfigured()) return DEFAULT_BANNER;
  try {
    const { data, error } = await supabase()
      .from('banner_settings')
      .select('*')
      .eq('id', BANNER_ROW_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return DEFAULT_BANNER;
    const row = data as BannerRow;
    return {
      enabled: Boolean(row.enabled),
      text: row.text ?? DEFAULT_BANNER.text,
      link: row.link ?? '',
      linkLabel: row.link_label ?? DEFAULT_BANNER.linkLabel,
      style:
        row.style === 'terracotta' || row.style === 'charcoal' ? row.style : 'palm',
      version: Number(row.version) || 1,
      updatedAt: row.updated_at ?? DEFAULT_BANNER.updatedAt
    };
  } catch (err) {
    console.error('[db] getBanner failed:', err);
    return DEFAULT_BANNER;
  }
}

export async function saveBanner(banner: BannerSettings): Promise<void> {
  const { error } = await supabase().from('banner_settings').upsert({
    id: BANNER_ROW_ID,
    enabled: banner.enabled,
    text: banner.text,
    link: banner.link,
    link_label: banner.linkLabel,
    style: banner.style,
    version: banner.version,
    updated_at: new Date().toISOString()
  });
  if (error) throw new Error(error.message);
}

// ── reservations ────────────────────────────────────────────────────────────

interface ReservationRow {
  id: string;
  ref: string;
  name: string;
  phone: string;
  services: StoredReservation['services'] | null;
  duration: number | null;
  subtotal: number | null;
  travel_fee: number | null;
  discount: number | null;
  promo_code: string | null;
  total: number | null;
  deposit_due: number | null;
  payment_status: string | null;
  date: string;
  time: string;
  notes: string;
  venue: string | null;
  address: string | null;
  area: string | null;
  locale: string;
  status: ReservationStatus;
  created_at: string;
}

function rowToReservation(row: ReservationRow): StoredReservation {
  const services = Array.isArray(row.services) ? row.services : [];
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    phone: row.phone,
    services,
    duration: Number(row.duration) || services.reduce((s, x) => s + (x.duration || 0), 0),
    subtotal: Number(row.subtotal) || 0,
    travelFee: Number(row.travel_fee) || 0,
    discount: Number(row.discount) || 0,
    promoCode: row.promo_code ?? '',
    total: Number(row.total) || 0,
    depositDue: Number(row.deposit_due) || 0,
    paymentStatus: (['unpaid', 'paid', 'refunded', 'failed'] as const).includes(
      row.payment_status as PaymentStatus
    )
      ? (row.payment_status as PaymentStatus)
      : 'unpaid',
    date: row.date,
    time: row.time,
    notes: row.notes,
    venue: row.venue === 'home' ? 'home' : 'shop',
    address: row.address ?? '',
    area: row.area === 'outside' ? 'outside' : 'inside',
    locale: row.locale === 'ar' ? 'ar' : 'en',
    status: row.status,
    createdAt: row.created_at
  };
}

export async function listReservations(): Promise<StoredReservation[]> {
  const { data, error } = await supabase()
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data as ReservationRow[]).map(rowToReservation);
}

export async function addReservation(
  input: Omit<StoredReservation, 'id' | 'status' | 'createdAt'>
): Promise<StoredReservation> {
  const { data, error } = await supabase()
    .from('reservations')
    .insert({
      ref: input.ref,
      name: input.name,
      phone: input.phone,
      services: input.services,
      duration: input.duration,
      subtotal: input.subtotal,
      travel_fee: input.travelFee,
      discount: input.discount,
      promo_code: input.promoCode,
      total: input.total,
      deposit_due: input.depositDue,
      payment_status: input.paymentStatus,
      date: input.date,
      time: input.time,
      notes: input.notes,
      venue: input.venue,
      address: input.address,
      area: input.area,
      locale: input.locale
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return rowToReservation(data as ReservationRow);
}

/** Is this exact slot already taken by a live booking? */
export async function isSlotTaken(date: string, time: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .select('id')
    .eq('date', date)
    .eq('time', time)
    .in('status', ['new', 'confirmed'])
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/** Slots already spoken for on a date, so the picker can grey them out. */
export async function takenSlots(date: string): Promise<string[]> {
  const { data, error } = await supabase()
    .from('reservations')
    .select('time')
    .eq('date', date)
    .in('status', ['new', 'confirmed']);
  if (error) throw new Error(error.message);
  return (data as Array<{ time: string }>).map((r) => r.time);
}

/** Look up one booking by its public credentials (reference + phone). */
export async function findReservation(ref: string, phone: string): Promise<StoredReservation | null> {
  const { data, error } = await supabase()
    .from('reservations')
    .select('*')
    .eq('ref', ref)
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToReservation(data as ReservationRow) : null;
}

export async function findReservationByRef(ref: string): Promise<StoredReservation | null> {
  const { data, error } = await supabase()
    .from('reservations')
    .select('*')
    .eq('ref', ref)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToReservation(data as ReservationRow) : null;
}

/** Client-initiated reschedule: new slot, status back to 'new' for re-confirmation. */
export async function rescheduleReservation(
  ref: string,
  phone: string,
  date: string,
  time: string
): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .update({ date, time, status: 'new' })
    .eq('ref', ref)
    .eq('phone', phone)
    .in('status', ['new', 'confirmed'])
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function cancelReservation(ref: string, phone: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('ref', ref)
    .eq('phone', phone)
    .in('status', ['new', 'confirmed'])
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function setReservationPaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
): Promise<void> {
  const { error } = await supabase()
    .from('reservations')
    .update({ payment_status: paymentStatus })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteReservation(id: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

// ── promo codes ─────────────────────────────────────────────────────────────

interface PromoRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  min_amount: number | null;
  active: boolean;
  created_at: string;
}

function rowToPromo(row: PromoRow): PromoCode {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type === 'fixed' ? 'fixed' : 'percent',
    discountValue: Number(row.discount_value) || 0,
    expiresAt: row.expires_at,
    maxUses: row.max_uses === null ? null : Number(row.max_uses),
    usesCount: Number(row.uses_count) || 0,
    minAmount: row.min_amount === null ? null : Number(row.min_amount),
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}

export async function listPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase()
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data as PromoRow[]).map(rowToPromo);
}

export async function findPromoByCode(code: string): Promise<PromoCode | null> {
  const { data, error } = await supabase()
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToPromo(data as PromoRow) : null;
}

export async function createPromoCode(
  input: Omit<PromoCode, 'id' | 'usesCount' | 'createdAt'>
): Promise<PromoCode> {
  const { data, error } = await supabase()
    .from('promo_codes')
    .insert({
      code: input.code.toUpperCase(),
      discount_type: input.discountType,
      discount_value: input.discountValue,
      expires_at: input.expiresAt,
      max_uses: input.maxUses,
      min_amount: input.minAmount,
      active: input.active
    })
    .select('*')
    .single();
  if (error) {
    // 23505 = unique_violation on promo_codes.code
    if (error.code === '23505') throw new Error('DUPLICATE_CODE');
    throw new Error(error.message);
  }
  return rowToPromo(data as PromoRow);
}

export async function updatePromoCode(
  id: string,
  patch: Partial<Pick<PromoCode, 'active' | 'discountType' | 'discountValue' | 'expiresAt' | 'maxUses' | 'minAmount'>>
): Promise<boolean> {
  const row: Record<string, unknown> = {};
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.discountType !== undefined) row.discount_type = patch.discountType;
  if (patch.discountValue !== undefined) row.discount_value = patch.discountValue;
  if (patch.expiresAt !== undefined) row.expires_at = patch.expiresAt;
  if (patch.maxUses !== undefined) row.max_uses = patch.maxUses;
  if (patch.minAmount !== undefined) row.min_amount = patch.minAmount;
  if (!Object.keys(row).length) return false;

  const { data, error } = await supabase().from('promo_codes').update(row).eq('id', id).select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function deletePromoCode(id: string): Promise<boolean> {
  const { data, error } = await supabase().from('promo_codes').delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/**
 * Atomically claim one use of a code and record the redemption.
 * Runs as a Postgres function so two people checking out at the same moment
 * can never push a code past its usage limit. Returns the remaining uses
 * (null when unlimited) or false when the claim failed.
 */
export async function redeemPromoCode(
  code: string,
  reservationId: string,
  amount: number
): Promise<{ ok: boolean; remaining: number | null }> {
  const { data, error } = await supabase().rpc('redeem_promo', {
    p_code: code.toUpperCase(),
    p_reservation: reservationId,
    p_amount: amount
  });
  if (error) {
    console.error('[db] redeem_promo failed:', error.message);
    return { ok: false, remaining: null };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.ok !== true) return { ok: false, remaining: null };
  return { ok: true, remaining: row.remaining === null ? null : Number(row.remaining) };
}

// ── payments ────────────────────────────────────────────────────────────────

interface PaymentRow {
  id: string;
  reservation_id: string;
  amount: number;
  status: string;
  stripe_payment_id: string;
  created_at: string;
}

function rowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    amount: Number(row.amount) || 0,
    status: (['unpaid', 'paid', 'refunded', 'failed'] as const).includes(row.status as PaymentStatus)
      ? (row.status as PaymentStatus)
      : 'unpaid',
    stripePaymentId: row.stripe_payment_id,
    createdAt: row.created_at
  };
}

/** One row per PaymentIntent; re-running a checkout updates the same row. */
export async function upsertPayment(input: {
  reservationId: string;
  amount: number;
  status: PaymentStatus;
  stripePaymentId: string;
}): Promise<void> {
  const { error } = await supabase().from('payments').upsert(
    {
      reservation_id: input.reservationId,
      amount: input.amount,
      status: input.status,
      stripe_payment_id: input.stripePaymentId
    },
    { onConflict: 'stripe_payment_id' }
  );
  if (error) throw new Error(error.message);
}

export async function listPayments(): Promise<Payment[]> {
  const { data, error } = await supabase()
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data as PaymentRow[]).map(rowToPayment);
}
