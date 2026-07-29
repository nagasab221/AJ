'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import Calendar from '@/components/booking/Calendar';
import PaymentPanel from '@/components/booking/PaymentPanel';
import PromoField from '@/components/booking/PromoField';
import SummaryPanel from '@/components/booking/SummaryPanel';
import { useBooking } from '@/components/booking/BookingProvider';
import {
  AlertIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HomeIcon,
  StoreIcon,
  WhatsAppIcon
} from '@/components/Icons';
import { formatDateLong, formatSlot, slotsForDate } from '@/lib/booking';
import { computeTotals, depositFor, toBookedService } from '@/lib/pricing';
import { cx, formatAED, whatsappLink } from '@/lib/utils';
import {
  t as pick,
  type BookedVenue,
  type BookingArea,
  type BookingSettings,
  type Locale,
  type PromoResult,
  type Service
} from '@/lib/types';

const STEP_KEYS = ['stepDetails', 'stepServices', 'stepWhere', 'stepWhen', 'stepConfirm'] as const;

interface SubmitResult {
  ref: string;
  depositDue: number;
  payable: boolean;
}

export default function BookingForm({
  services,
  settings,
  whatsapp,
  locale,
  stripeEnabled
}: {
  services: Service[];
  settings: BookingSettings;
  whatsapp: string;
  locale: Locale;
  stripeEnabled: boolean;
}) {
  const t = useTranslations('booking');
  const tp = useTranslations('payment');
  const c = useTranslations('common');
  const { selected, toggle, remove, clear } = useBooking();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [venue, setVenue] = useState<BookedVenue>(settings.shopOpen ? 'shop' : 'home');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState<BookingArea>('inside');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [payNow, setPayNow] = useState(false);
  const [taken, setTaken] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [paid, setPaid] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  // ── derived ───────────────────────────────────────────────────────────────

  const chosen = useMemo(
    () => services.filter((s) => selected.includes(s.id)),
    [services, selected]
  );

  const booked = useMemo(() => chosen.map((s) => toBookedService(s, locale)), [chosen, locale]);

  // A service marked shop-only or home-only pins the venue for the whole visit.
  const forcedVenue: BookedVenue | null = useMemo(() => {
    if (!settings.shopOpen) return 'home';
    if (chosen.some((s) => (s.venue ?? 'both') === 'shop')) return 'shop';
    if (chosen.some((s) => (s.venue ?? 'both') === 'home')) return 'home';
    return null;
  }, [chosen, settings.shopOpen]);

  useEffect(() => {
    if (forcedVenue && venue !== forcedVenue) setVenue(forcedVenue);
  }, [forcedVenue, venue]);

  const travelFee = venue === 'home' && area === 'outside' ? settings.travelFee : 0;
  const totals = useMemo(
    () => computeTotals(booked, travelFee, promo?.ok ? (promo.discount ?? 0) : 0),
    [booked, travelFee, promo]
  );
  const deposit = useMemo(
    () => (stripeEnabled ? depositFor(totals.total, settings) : 0),
    [stripeEnabled, totals.total, settings]
  );

  // Keep an applied code honest when the basket changes underneath it.
  const validatedFor = useRef<number | null>(null);
  useEffect(() => {
    if (!promo?.ok || !promo.code) return;
    if (validatedFor.current === totals.subtotal) return;
    validatedFor.current = totals.subtotal;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/promo/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promo.code, subtotal: totals.subtotal })
        });
        const data = (await res.json()) as PromoResult;
        if (cancelled) return;
        setPromo(data.ok ? data : null);
      } catch {
        /* leave the current discount alone; the server decides at submit time */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [promo, totals.subtotal]);

  // Which slots are already gone on the chosen day.
  useEffect(() => {
    if (!date) {
      setTaken([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/slots?date=${encodeURIComponent(date)}`);
        const data = (await res.json()) as { taken?: string[] };
        if (!cancelled) setTaken(data.taken ?? []);
      } catch {
        if (!cancelled) setTaken([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const slots = useMemo(
    () => (date ? slotsForDate(settings, date, totals.duration || 30) : []),
    [date, settings, totals.duration]
  );

  // Dropping a service can make the current slot too short, re-check silently.
  useEffect(() => {
    if (time && date && !slots.includes(time)) setTime('');
  }, [slots, time, date]);

  // ── navigation ────────────────────────────────────────────────────────────

  function validateStep(index: number): string {
    if (index === 0) {
      if (!name.trim()) return t('errorName');
      if (!/^(?:\+971|00971|971|0)?5\d{8}$/.test(phone.replace(/[\s\-().]/g, ''))) {
        return t('errorPhone');
      }
    }
    if (index === 1 && selected.length === 0) return t('noServicesPicked');
    if (index === 2 && venue === 'home' && !address.trim()) return t('addressRequired');
    if (index === 3 && (!date || !time)) return t('pickTime');
    return '';
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goBack() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    for (let i = 0; i < STEP_KEYS.length - 1; i++) {
      const message = validateStep(i);
      if (message) {
        setStep(i);
        setError(message);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    const honeypot = (event.currentTarget.elements.namedItem('company') as HTMLInputElement | null)?.value;

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          serviceIds: selected,
          venue,
          address,
          area,
          date,
          time,
          notes,
          promoCode: promo?.ok ? promo.code : '',
          payNow,
          locale,
          company: honeypot
        })
      });

      const data = (await res.json()) as {
        ok?: boolean;
        ref?: string;
        depositDue?: number;
        payable?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.ref) {
        setError(data.error === 'slot_taken' ? t('errorSlot') : t('errorGeneric'));
        setSubmitting(false);
        return;
      }

      setResult({
        ref: data.ref,
        depositDue: data.depositDue ?? 0,
        payable: Boolean(data.payable)
      });
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    clear();
    setResult(null);
    setPaid(false);
    setStep(0);
    setName('');
    setPhone('');
    setAddress('');
    setDate('');
    setTime('');
    setNotes('');
    setPromo(null);
    setPayNow(false);
  }

  // ── payment stage ─────────────────────────────────────────────────────────

  if (result && result.payable && result.depositDue > 0 && !paid) {
    return (
      <div ref={topRef} className="mx-auto max-w-xl">
        <div className="mb-6 rounded-2xl border border-palm/30 bg-palm-mist p-5 text-center">
          <p className="text-[0.85rem] font-semibold uppercase tracking-wide2 text-stone">
            {t('yourRef')}
          </p>
          <p dir="ltr" className="mt-1 font-display text-3xl tracking-wide2 text-palm">
            {result.ref}
          </p>
        </div>
        <PaymentPanel
          bookingRef={result.ref}
          phone={phone}
          amount={result.depositDue}
          locale={locale}
          onPaid={() => setPaid(true)}
          onSkip={() => setPaid(true)}
        />
      </div>
    );
  }

  // ── success ───────────────────────────────────────────────────────────────

  if (result) {
    const lines = [
      `${locale === 'ar' ? 'حجز جديد' : 'New booking'}, AJ`,
      `${locale === 'ar' ? 'المرجع' : 'Ref'}: ${result.ref}`,
      `${locale === 'ar' ? 'الاسم' : 'Name'}: ${name}`,
      `${locale === 'ar' ? 'الخدمات' : 'Services'}: ${booked.map((s) => s.name).join(', ')}`,
      `${locale === 'ar' ? 'التاريخ' : 'Date'}: ${formatDateLong(date, locale)} ${formatSlot(time, locale)}`,
      `${locale === 'ar' ? 'الإجمالي' : 'Total'}: ${formatAED(totals.total, locale)}`
    ];

    return (
      <div ref={topRef} className="mx-auto max-w-xl text-center">
        <span className="arch-sm mx-auto flex h-16 w-14 items-center justify-center border border-palm text-palm">
          <CheckIcon className="h-7 w-7" />
        </span>

        <h3 className="mt-7 font-display text-[2.2rem] leading-tight text-charcoal">
          {t('successTitle')}
        </h3>
        <p className="mt-3 text-[1.02rem] text-stone">{t('successBody')}</p>

        <div className="mt-8 rounded-2xl border border-dune-dark bg-paper p-6">
          <p className="text-[0.8rem] font-semibold uppercase tracking-wide2 text-stone">
            {t('yourRef')}
          </p>
          <p dir="ltr" className="mt-2 font-display text-4xl tracking-wide2 text-palm">
            {result.ref}
          </p>

          <dl className="mt-6 space-y-2 border-t border-dune pt-5 text-start text-[0.95rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-stone">{t('stepWhen')}</dt>
              <dd className="text-charcoal">
                {formatDateLong(date, locale)} · {formatSlot(time, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">{t('summaryTotal')}</dt>
              <dd className="font-semibold text-charcoal">{formatAED(totals.total, locale)}</dd>
            </div>
            {paid && result.depositDue > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-stone">{tp('heading')}</dt>
                <dd className="font-semibold text-palm">{tp('success')}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappLink(whatsapp, lines.join('\n'))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-palm"
          >
            <WhatsAppIcon className="h-4 w-4" />
            {t('sendWhatsapp')}
          </a>
          <button type="button" onClick={startOver} className="btn-outline">
            {t('addAnother')}
          </button>
        </div>
      </div>
    );
  }

  // ── form ──────────────────────────────────────────────────────────────────

  return (
    <div ref={topRef} className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      <form onSubmit={submit} noValidate className="lg:col-span-7 xl:col-span-8">
        {/* Honeypot */}
        <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
          <label htmlFor="booking-company">Company</label>
          <input id="booking-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {/* Stepper */}
        <ol className="no-scrollbar mb-9 flex items-center gap-2 overflow-x-auto pb-1">
          {STEP_KEYS.map((key, i) => (
            <li key={key} className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (i < step) {
                    setStep(i);
                    setError('');
                  }
                }}
                disabled={i > step}
                className={cx(
                  'flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.82rem] font-semibold transition-colors',
                  i === step
                    ? 'bg-palm text-linen'
                    : i < step
                      ? 'text-palm hover:bg-palm-mist'
                      : 'text-stone-light'
                )}
              >
                <span
                  className={cx(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem]',
                    i === step ? 'bg-linen/20' : i < step ? 'bg-palm-mist' : 'bg-dune/60'
                  )}
                >
                  {i < step ? <CheckIcon className="h-3 w-3" /> : i + 1}
                </span>
                {t(key)}
              </button>
              {i < STEP_KEYS.length - 1 ? (
                <span aria-hidden className="h-px w-4 bg-dune-dark" />
              ) : null}
            </li>
          ))}
        </ol>

        {/* Step 1, details */}
        {step === 0 ? (
          <div className="space-y-6">
            <div>
              <label className="label" htmlFor="booking-name">
                {t('name')}
              </label>
              <input
                id="booking-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                autoComplete="name"
                maxLength={80}
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="booking-phone">
                {t('phone')}
              </label>
              <input
                id="booking-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                autoComplete="tel"
                inputMode="tel"
                dir="ltr"
                maxLength={20}
                className="field"
              />
              <p className="mt-2 text-[0.85rem] text-stone">{t('phoneHint')}</p>
            </div>
          </div>
        ) : null}

        {/* Step 2, services */}
        {step === 1 ? (
          <div>
            <h3 className="font-display text-2xl text-charcoal">{t('chooseServices')}</h3>
            <p className="mt-2 text-[0.95rem] text-stone">{t('chooseServicesHint')}</p>

            <ul className="mt-6 space-y-2.5">
              {services.map((service) => {
                const picked = selected.includes(service.id);
                return (
                  <li key={service.id}>
                    <button
                      type="button"
                      onClick={() => toggle(service.id)}
                      aria-pressed={picked}
                      className={cx(
                        'flex w-full items-center gap-4 rounded-xl border p-4 text-start transition-colors',
                        picked
                          ? 'border-palm bg-palm-mist'
                          : 'border-dune bg-paper hover:border-dune-deep'
                      )}
                    >
                      <span
                        className={cx(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                          picked ? 'border-palm bg-palm text-linen' : 'border-dune-deep'
                        )}
                      >
                        {picked ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[1rem] font-semibold text-charcoal">
                          {pick(service.name, locale)}
                        </span>
                        <span className="mt-0.5 block text-[0.82rem] text-stone">
                          {service.duration} {locale === 'ar' ? 'د' : 'min'}
                        </span>
                      </span>
                      <span className="shrink-0 font-display text-lg text-palm">
                        {formatAED(service.price, locale)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {/* Step 3, where */}
        {step === 2 ? (
          <div className="space-y-6">
            <h3 className="font-display text-2xl text-charcoal">{t('where')}</h3>

            {!settings.shopOpen ? (
              <p className="rounded-xl bg-terracotta-mist px-4 py-3 text-[0.92rem] text-charcoal">
                {t('shopClosed')}
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['shop', 'home'] as const).map((option) => {
                const disabled =
                  (option === 'shop' && !settings.shopOpen) ||
                  (forcedVenue !== null && forcedVenue !== option);
                const Icon = option === 'shop' ? StoreIcon : HomeIcon;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    onClick={() => setVenue(option)}
                    aria-pressed={venue === option}
                    className={cx(
                      'flex items-start gap-3 rounded-2xl border p-5 text-start transition-colors',
                      venue === option
                        ? 'border-palm bg-palm-mist'
                        : 'border-dune bg-paper hover:border-dune-deep',
                      disabled && 'cursor-not-allowed opacity-45'
                    )}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-palm" />
                    <span>
                      <span className="block font-semibold text-charcoal">
                        {t(option === 'shop' ? 'atShop' : 'atHome')}
                      </span>
                      <span className="mt-1 block text-[0.85rem] text-stone">
                        {t(option === 'shop' ? 'atShopHint' : 'atHomeHint')}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {venue === 'home' ? (
              <>
                <div>
                  <label className="label" htmlFor="booking-address">
                    {t('address')}
                  </label>
                  <textarea
                    id="booking-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('addressPlaceholder')}
                    rows={3}
                    maxLength={400}
                    className="field resize-y"
                  />
                </div>

                <fieldset>
                  <legend className="label">
                    {t('area', { area: pick(settings.areaName, locale) })}
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(['inside', 'outside'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setArea(option)}
                        aria-pressed={area === option}
                        className={cx(
                          'rounded-xl border p-4 text-start text-[0.95rem] transition-colors',
                          area === option
                            ? 'border-palm bg-palm-mist text-charcoal'
                            : 'border-dune bg-paper text-stone hover:border-dune-deep'
                        )}
                      >
                        {t(option === 'inside' ? 'areaInside' : 'areaOutside', {
                          area: pick(settings.areaName, locale)
                        })}
                      </button>
                    ))}
                  </div>
                  {area === 'outside' ? (
                    <p className="mt-3 text-[0.88rem] font-semibold text-terracotta-dark">
                      {t('areaOutsideNote', {
                        fee: formatAED(settings.travelFee, locale),
                        area: pick(settings.areaName, locale)
                      })}
                    </p>
                  ) : null}
                </fieldset>
              </>
            ) : null}
          </div>
        ) : null}

        {/* Step 4, when */}
        {step === 3 ? (
          <div className="space-y-7">
            <div>
              <h3 className="font-display text-2xl text-charcoal">{t('pickDate')}</h3>
              <div className="mt-4">
                <Calendar
                  settings={settings}
                  value={date}
                  onChange={(d) => {
                    setDate(d);
                    setTime('');
                  }}
                  locale={locale}
                  neededMinutes={totals.duration || 30}
                />
              </div>
            </div>

            {date ? (
              <div>
                <h3 className="font-display text-2xl text-charcoal">{t('pickTime')}</h3>
                <p className="mt-1.5 text-[0.9rem] text-stone">{formatDateLong(date, locale)}</p>

                {slots.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-dune/40 px-4 py-3 text-[0.92rem] text-charcoal">
                    {t('noSlots')}
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {slots.map((slot) => {
                      const gone = taken.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={gone}
                          onClick={() => setTime(slot)}
                          aria-pressed={time === slot}
                          className={cx(
                            'rounded-xl border px-2 py-3 text-[0.9rem] font-semibold transition-colors',
                            time === slot
                              ? 'border-palm bg-palm text-linen'
                              : gone
                                ? 'cursor-not-allowed border-dune bg-dune/25 text-stone-light line-through'
                                : 'border-dune bg-paper text-charcoal hover:border-palm hover:text-palm'
                          )}
                        >
                          {formatSlot(slot, locale)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Step 5, confirm */}
        {step === 4 ? (
          <div className="space-y-7">
            <div>
              <h3 className="font-display text-2xl text-charcoal">{t('confirmTitle')}</h3>
              <p className="mt-2 text-[0.95rem] text-stone">{t('confirmSubtitle')}</p>
            </div>

            <div className="rounded-2xl border border-dune bg-paper p-5">
              <dl className="space-y-3 text-[0.95rem]">
                <div className="flex justify-between gap-4">
                  <dt className="text-stone">{t('name')}</dt>
                  <dd className="text-charcoal">{name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone">{t('phone')}</dt>
                  <dd dir="ltr" className="text-charcoal">
                    {phone}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone">{t('stepWhere')}</dt>
                  <dd className="text-end text-charcoal">
                    {venue === 'home' ? `${t('atHome')}, ${address}` : t('atShop')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone">{t('stepWhen')}</dt>
                  <dd className="text-end text-charcoal">
                    {formatDateLong(date, locale)} · {formatSlot(time, locale)}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <label className="label" htmlFor="booking-notes">
                {t('notes')}
              </label>
              <textarea
                id="booking-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
                maxLength={600}
                className="field resize-y"
              />
            </div>

            <PromoField
              subtotal={totals.subtotal}
              applied={promo}
              onApply={setPromo}
              onClear={() => {
                setPromo(null);
                validatedFor.current = null;
              }}
              locale={locale}
            />

            {/* Summary repeated here on phones, where the sticky panel is hidden. */}
            <div className="lg:hidden">
              <SummaryPanel
                services={booked}
                totals={totals}
                deposit={deposit}
                locale={locale}
                compact
              />
            </div>

            {deposit > 0 ? (
              <fieldset className="rounded-2xl border border-dune bg-paper p-5">
                <legend className="px-2 text-[0.8rem] font-semibold uppercase tracking-wide2 text-stone">
                  {tp('heading')}
                </legend>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPayNow(true)}
                    aria-pressed={payNow}
                    className={cx(
                      'flex w-full items-start gap-3 rounded-xl border p-4 text-start transition-colors',
                      payNow ? 'border-palm bg-palm-mist' : 'border-dune hover:border-dune-deep'
                    )}
                  >
                    <span
                      className={cx(
                        'mt-0.5 h-5 w-5 shrink-0 rounded-full border-2',
                        payNow ? 'border-palm bg-palm' : 'border-dune-deep'
                      )}
                    />
                    <span>
                      <span className="block font-semibold text-charcoal">
                        {tp('payNow', { amount: formatAED(deposit, locale) })}
                      </span>
                      <span className="mt-1 block text-[0.85rem] text-stone">{tp('payNowHint')}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayNow(false)}
                    aria-pressed={!payNow}
                    disabled={settings.depositRequired}
                    className={cx(
                      'flex w-full items-start gap-3 rounded-xl border p-4 text-start transition-colors',
                      !payNow ? 'border-palm bg-palm-mist' : 'border-dune hover:border-dune-deep',
                      settings.depositRequired && 'cursor-not-allowed opacity-45'
                    )}
                  >
                    <span
                      className={cx(
                        'mt-0.5 h-5 w-5 shrink-0 rounded-full border-2',
                        !payNow ? 'border-palm bg-palm' : 'border-dune-deep'
                      )}
                    />
                    <span>
                      <span className="block font-semibold text-charcoal">{tp('payLater')}</span>
                      <span className="mt-1 block text-[0.85rem] text-stone">
                        {settings.depositRequired ? tp('required') : tp('payLaterHint')}
                      </span>
                    </span>
                  </button>
                </div>
              </fieldset>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="mt-6 flex items-start gap-2 rounded-xl bg-terracotta-mist px-4 py-3 text-[0.92rem] font-semibold text-terracotta-dark">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}

        {/* Controls */}
        <div className="mt-9 flex items-center gap-3">
          {step > 0 ? (
            <button type="button" onClick={goBack} className="btn-outline">
              <ChevronLeftIcon className="h-4 w-4 flip-rtl" />
              {c('back')}
            </button>
          ) : null}

          {step < STEP_KEYS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-palm ms-auto">
              {c('next')}
              <ChevronRightIcon className="h-4 w-4 flip-rtl" />
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="btn-palm ms-auto">
              {submitting ? t('submitting') : t('submit')}
            </button>
          )}
        </div>
      </form>

      {/* Sticky summary */}
      <div className="hidden lg:col-span-5 lg:block xl:col-span-4">
        <div className="sticky" style={{ top: 'calc(var(--header-h) + 1.5rem)' }}>
          <SummaryPanel
            services={booked}
            totals={totals}
            deposit={deposit}
            locale={locale}
            onRemove={remove}
          />
          {booked.length > 0 && date && time ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-[0.82rem] text-stone">
              <ClockIcon className="h-4 w-4" />
              {formatDateLong(date, locale)} · {formatSlot(time, locale)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
