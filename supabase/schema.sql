-- ═══════════════════════════════════════════════════════════════════════════
-- AJ Barbershop — Supabase schema
--
-- Run once: Supabase dashboard → SQL Editor → New query → paste all of this →
-- Run. Safe to re-run; every statement is idempotent.
--
-- Security model: RLS is ON for every table and NO policies are created, so
-- these tables are reachable only with the service-role key, which lives in
-- Cloudflare's secret store and is used server-side only. The browser never
-- holds a Supabase credential.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Editable site copy: one JSONB document, seeded by the app on first load ──
create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;

-- ── Announcement banner (single row, id 'main') ─────────────────────────────
create table if not exists public.banner_settings (
  id text primary key,
  enabled boolean not null default false,
  text jsonb not null default '{"en":"","ar":""}'::jsonb,
  link text not null default '',
  link_label jsonb not null default '{"en":"","ar":""}'::jsonb,
  style text not null default 'palm' check (style in ('palm', 'terracotta', 'charcoal')),
  -- Bump to make a dismissed banner reappear for every visitor.
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.banner_settings enable row level security;

insert into public.banner_settings (id, enabled, text, link, link_label, style)
values (
  'main',
  false,
  '{"en":"Eid offer — 20% off every fade with code EID20","ar":"عرض العيد — خصم ٢٠٪ على كل قصة بكود EID20"}'::jsonb,
  '#booking',
  '{"en":"Book now","ar":"احجز الآن"}'::jsonb,
  'palm'
)
on conflict (id) do nothing;

-- ── Bookings (the /admin inbox) ─────────────────────────────────────────────
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  name text not null,
  phone text not null,
  -- Frozen copy of what was booked: [{id, name, price, duration}, …]
  services jsonb not null default '[]'::jsonb,
  duration integer not null default 0,
  subtotal numeric(10, 2) not null default 0,
  travel_fee numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  promo_code text not null default '',
  total numeric(10, 2) not null default 0,
  deposit_due numeric(10, 2) not null default 0,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded', 'failed')),
  date date not null,
  time text not null,
  notes text not null default '',
  venue text not null default 'shop' check (venue in ('home', 'shop')),
  address text not null default '',
  area text not null default 'inside' check (area in ('inside', 'outside')),
  locale text not null default 'en',
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'completed', 'cancelled', 'no-show')),
  created_at timestamptz not null default now()
);
create index if not exists reservations_created_at_idx on public.reservations (created_at desc);
create index if not exists reservations_slot_idx on public.reservations (date, time);
create unique index if not exists reservations_ref_idx on public.reservations (ref);
alter table public.reservations enable row level security;

-- ── Promo codes ─────────────────────────────────────────────────────────────
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null default 0,
  -- null = never expires
  expires_at date,
  -- null = unlimited uses
  max_uses integer,
  uses_count integer not null default 0,
  -- null = no minimum spend
  min_amount numeric(10, 2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists promo_codes_code_idx on public.promo_codes (upper(code));
alter table public.promo_codes enable row level security;

-- ── Redemptions: which booking used which code ──────────────────────────────
create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_id uuid not null references public.promo_codes (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete set null,
  code text not null,
  amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists promo_redemptions_promo_idx on public.promo_redemptions (promo_id);
alter table public.promo_redemptions enable row level security;

-- ── Payments (Stripe) ───────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations (id) on delete cascade,
  amount numeric(10, 2) not null default 0,
  status text not null default 'unpaid'
    check (status in ('unpaid', 'paid', 'refunded', 'failed')),
  stripe_payment_id text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists payments_stripe_id_idx on public.payments (stripe_payment_id);
create index if not exists payments_reservation_idx on public.payments (reservation_id);
alter table public.payments enable row level security;

-- ── Atomic promo redemption ─────────────────────────────────────────────────
-- Claims one use and writes the redemption row in a single statement, so two
-- customers checking out at the same instant cannot both take the last use.
-- Returns ok + how many uses remain (null when unlimited).
create or replace function public.redeem_promo(
  p_code text,
  p_reservation uuid,
  p_amount numeric
)
returns table (ok boolean, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_max integer;
  v_used integer;
begin
  update public.promo_codes
     set uses_count = uses_count + 1
   where upper(code) = upper(p_code)
     and active
     and (expires_at is null or expires_at >= (now() at time zone 'Asia/Dubai')::date)
     and (max_uses is null or uses_count < max_uses)
  returning id, max_uses, uses_count into v_id, v_max, v_used;

  if v_id is null then
    return query select false, null::integer;
    return;
  end if;

  insert into public.promo_redemptions (promo_id, reservation_id, code, amount)
  values (v_id, p_reservation, upper(p_code), coalesce(p_amount, 0));

  return query select true, case when v_max is null then null else greatest(v_max - v_used, 0) end;
end;
$$;

-- ── Image uploads from /admin (public read, service-role write) ─────────────
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
