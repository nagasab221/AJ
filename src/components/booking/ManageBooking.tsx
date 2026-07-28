'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import Calendar from '@/components/booking/Calendar';
import { AlertIcon, CheckIcon, ClockIcon } from '@/components/Icons';
import { formatDateLong, formatSlot, slotsForDate } from '@/lib/booking';
import { cx, formatAED } from '@/lib/utils';
import type { BookingSettings, Locale, PaymentStatus, ReservationStatus } from '@/lib/types';

interface FoundBooking {
  ref: string;
  name: string;
  date: string;
  time: string;
  services: Array<{ id: string; name: string; price: number; duration: number }>;
  total: number;
  duration: number;
  venue: 'home' | 'shop';
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
}

const STATUS_KEY: Record<ReservationStatus, string> = {
  new: 'statusNew',
  confirmed: 'statusConfirmed',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
  'no-show': 'statusNoShow'
};

export default function ManageBooking({
  settings,
  locale
}: {
  settings: BookingSettings;
  locale: Locale;
}) {
  const t = useTranslations('manage');
  const tb = useTranslations('booking');
  const tp = useTranslations('payment');
  const c = useTranslations('common');

  const [ref, setRef] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<FoundBooking | null>(null);
  const [notice, setNotice] = useState('');

  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [taken, setTaken] = useState<string[]>([]);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!newDate) {
      setTaken([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/slots?date=${encodeURIComponent(newDate)}`);
        const data = (await res.json()) as { taken?: string[] };
        if (!cancelled) setTaken(data.taken ?? []);
      } catch {
        if (!cancelled) setTaken([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [newDate]);

  const slots = useMemo(
    () => (newDate ? slotsForDate(settings, newDate, booking?.duration || 30) : []),
    [newDate, settings, booking?.duration]
  );

  async function call(action: 'find' | 'reschedule' | 'cancel', extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/manage-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ref: ref.trim().toUpperCase(), phone: phone.trim(), ...extra })
      });
      const data = (await res.json()) as {
        ok?: boolean;
        booking?: FoundBooking;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error === 'locked' ? t('cannotChange') : t('notFound'));
        if (action === 'find') setBooking(null);
        return null;
      }

      if (data.booking) setBooking(data.booking);
      return data;
    } catch {
      setError(t('notFound'));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onFind(event: React.FormEvent) {
    event.preventDefault();
    setRescheduling(false);
    setConfirmingCancel(false);
    await call('find');
  }

  async function onReschedule() {
    if (!newDate || !newTime) return;
    const data = await call('reschedule', { date: newDate, time: newTime });
    if (data?.ok) {
      setNotice(t('rescheduled'));
      setRescheduling(false);
      setNewDate('');
      setNewTime('');
    }
  }

  async function onCancel() {
    const data = await call('cancel');
    if (data?.ok) {
      setNotice(t('cancelled'));
      setConfirmingCancel(false);
    }
  }

  const locked =
    booking !== null && !['new', 'confirmed'].includes(booking.status);

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={onFind} className="card p-6 md:p-7">
        <h3 className="font-display text-2xl text-charcoal">{t('title')}</h3>
        <p className="mt-2 text-[0.95rem] text-stone">{t('subtitle')}</p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="manage-ref">
              {t('ref')}
            </label>
            <input
              id="manage-ref"
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              placeholder={t('refPlaceholder')}
              dir="ltr"
              maxLength={12}
              autoComplete="off"
              className="field font-semibold uppercase tracking-wide2"
            />
          </div>
          <div>
            <label className="label" htmlFor="manage-phone">
              {t('phone')}
            </label>
            <input
              id="manage-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={tb('phonePlaceholder')}
              dir="ltr"
              inputMode="tel"
              maxLength={20}
              autoComplete="tel"
              className="field"
            />
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-palm mt-6 w-full sm:w-auto">
          {busy ? t('searching') : t('find')}
        </button>

        {error ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-terracotta-mist px-4 py-3 text-[0.92rem] font-semibold text-terracotta-dark">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </form>

      {notice ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-palm/30 bg-palm-mist px-4 py-3 text-[0.95rem] font-semibold text-palm">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </p>
      ) : null}

      {booking ? (
        <div className="card mt-6 p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-wide2 text-stone">
                {t('found')}
              </p>
              <p dir="ltr" className="mt-1 font-display text-3xl tracking-wide2 text-palm">
                {booking.ref}
              </p>
            </div>
            <span
              className={cx(
                'badge',
                booking.status === 'cancelled'
                  ? 'bg-terracotta-mist text-terracotta-dark'
                  : booking.status === 'confirmed' || booking.status === 'completed'
                    ? 'bg-palm-mist text-palm'
                    : 'bg-dune text-charcoal'
              )}
            >
              {t(STATUS_KEY[booking.status] as 'statusNew')}
            </span>
          </div>

          <dl className="mt-6 space-y-3 border-t border-dune pt-5 text-[0.95rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-stone">{tb('name')}</dt>
              <dd className="text-charcoal">{booking.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">{tb('summaryServices')}</dt>
              <dd className="text-end text-charcoal">
                {booking.services.map((s) => s.name).join(', ')}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">{tb('stepWhen')}</dt>
              <dd className="text-end text-charcoal">
                {formatDateLong(booking.date, locale)} · {formatSlot(booking.time, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">{tb('stepWhere')}</dt>
              <dd className="text-charcoal">
                {tb(booking.venue === 'home' ? 'atHome' : 'atShop')}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">{tb('summaryTotal')}</dt>
              <dd className="font-semibold text-charcoal">{formatAED(booking.total, locale)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">{tp('heading')}</dt>
              <dd className="text-charcoal">
                {tp(
                  booking.paymentStatus === 'paid'
                    ? 'statusPaid'
                    : booking.paymentStatus === 'refunded'
                      ? 'statusRefunded'
                      : 'statusUnpaid'
                )}
              </dd>
            </div>
          </dl>

          {locked ? (
            <p className="mt-6 rounded-xl bg-dune/40 px-4 py-3 text-[0.92rem] text-charcoal">
              {t('cannotChange')}
            </p>
          ) : (
            <>
              {!rescheduling && !confirmingCancel ? (
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setRescheduling(true)}
                    className="btn-outline"
                  >
                    <ClockIcon className="h-4 w-4" />
                    {t('reschedule')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(true)}
                    className="btn border border-terracotta-dark text-terracotta-dark hover:bg-terracotta-dark hover:text-white"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : null}

              {confirmingCancel ? (
                <div className="mt-7 rounded-2xl border border-terracotta-dark/40 bg-terracotta-mist p-5">
                  <p className="font-semibold text-charcoal">{t('cancelConfirm')}</p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={busy}
                      className="btn bg-terracotta-dark text-white hover:bg-terracotta"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(false)}
                      className="btn-outline"
                    >
                      {t('keepIt')}
                    </button>
                  </div>
                </div>
              ) : null}

              {rescheduling ? (
                <div className="mt-7 space-y-5">
                  <Calendar
                    settings={settings}
                    value={newDate}
                    onChange={(d) => {
                      setNewDate(d);
                      setNewTime('');
                    }}
                    locale={locale}
                    neededMinutes={booking.duration || 30}
                  />

                  {newDate ? (
                    slots.length === 0 ? (
                      <p className="rounded-xl bg-dune/40 px-4 py-3 text-[0.92rem] text-charcoal">
                        {tb('noSlots')}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                        {slots.map((slot) => {
                          const gone = taken.includes(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={gone}
                              onClick={() => setNewTime(slot)}
                              aria-pressed={newTime === slot}
                              className={cx(
                                'rounded-xl border px-2 py-3 text-[0.9rem] font-semibold transition-colors',
                                newTime === slot
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
                    )
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={onReschedule}
                      disabled={busy || !newDate || !newTime}
                      className="btn-palm"
                    >
                      {t('rescheduleSave')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRescheduling(false)}
                      className="btn-outline"
                    >
                      {c('cancel')}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
