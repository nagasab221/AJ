'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ui';
import { CheckIcon, ClockIcon, HomeIcon, PhoneIcon, StoreIcon, TrashIcon, WhatsAppIcon } from '@/components/Icons';
import { formatDateLong, formatSlot, dubaiTodayISO } from '@/lib/booking';
import { cx, formatAED, whatsappLink } from '@/lib/utils';
import type { ReservationStatus, StoredReservation } from '@/lib/types';

const STATUS_LABEL: Record<ReservationStatus, string> = {
  new: 'New, needs confirming',
  confirmed: 'Confirmed',
  completed: 'Finished',
  cancelled: 'Cancelled',
  'no-show': 'Did not show up'
};

const STATUS_STYLE: Record<ReservationStatus, string> = {
  new: 'bg-terracotta text-white',
  confirmed: 'bg-palm text-white',
  completed: 'bg-dune-dark text-charcoal',
  cancelled: 'bg-charcoal/15 text-charcoal',
  'no-show': 'bg-charcoal/15 text-charcoal'
};

type Filter = 'new' | 'upcoming' | 'all';

export default function BookingsPanel({
  reservations,
  onChanged,
  initialFilter = 'new'
}: {
  reservations: StoredReservation[];
  onChanged: () => void;
  initialFilter?: Filter;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [busyId, setBusyId] = useState('');
  const [confirming, setConfirming] = useState<
    { booking: StoredReservation; action: 'cancel' | 'delete' } | null
  >(null);

  const today = dubaiTodayISO();

  const shown = useMemo(() => {
    if (filter === 'new') return reservations.filter((r) => r.status === 'new');
    if (filter === 'upcoming') {
      return reservations.filter(
        (r) => r.date >= today && (r.status === 'new' || r.status === 'confirmed')
      );
    }
    return reservations;
  }, [reservations, filter, today]);

  async function setStatus(booking: StoredReservation, status: ReservationStatus) {
    setBusyId(booking.id);
    try {
      await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id, status })
      });
      onChanged();
    } finally {
      setBusyId('');
      setConfirming(null);
    }
  }

  async function remove(booking: StoredReservation) {
    setBusyId(booking.id);
    try {
      await fetch('/api/admin/reservations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id })
      });
      onChanged();
    } finally {
      setBusyId('');
      setConfirming(null);
    }
  }

  const counts = {
    new: reservations.filter((r) => r.status === 'new').length,
    upcoming: reservations.filter(
      (r) => r.date >= today && (r.status === 'new' || r.status === 'confirmed')
    ).length,
    all: reservations.length
  };

  return (
    <div>
      <h1 className="a-h1">Bookings</h1>
      <p className="mt-3 max-w-2xl text-[1.1rem] text-charcoal-soft">
        Every booking made on the website. Confirm the new ones so the customer knows you have
        their appointment.
      </p>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap gap-3">
        {(
          [
            ['new', `New bookings (${counts.new})`],
            ['upcoming', `Coming up (${counts.upcoming})`],
            ['all', `Everything (${counts.all})`]
          ] as Array<[Filter, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={cx(
              'rounded-xl border-2 px-5 text-[1.05rem] font-bold transition-colors',
              filter === key
                ? 'border-palm bg-palm text-white'
                : 'border-charcoal/25 bg-white text-charcoal hover:border-palm hover:text-palm'
            )}
            style={{ minHeight: '3.25rem' }}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="a-card mt-8 text-center">
          <p className="text-[1.15rem] text-charcoal">
            {filter === 'new'
              ? 'No new bookings right now. When someone books, it will appear here.'
              : 'Nothing to show here yet.'}
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {shown.map((booking) => (
            <li key={booking.id}>
              <article className="a-card">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-[1.6rem] font-bold leading-tight text-charcoal">
                      {booking.name}
                    </h2>
                    <p dir="ltr" className="mt-1 text-[1.1rem] text-charcoal-soft">
                      {booking.phone}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cx('a-status', STATUS_STYLE[booking.status])}>
                      {STATUS_LABEL[booking.status]}
                    </span>
                    <span className="text-[0.95rem] font-bold text-stone">
                      Reference: <span dir="ltr">{booking.ref}</span>
                    </span>
                  </div>
                </div>

                {/* Facts */}
                <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 border-t-2 border-dune pt-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.95rem] font-bold uppercase tracking-wide2 text-stone">
                      When
                    </dt>
                    <dd className="mt-1 flex items-center gap-2 text-[1.15rem] text-charcoal">
                      <ClockIcon className="h-5 w-5 text-palm" />
                      {formatDateLong(booking.date, 'en')} at {formatSlot(booking.time, 'en')}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[0.95rem] font-bold uppercase tracking-wide2 text-stone">
                      Where
                    </dt>
                    <dd className="mt-1 flex items-start gap-2 text-[1.15rem] text-charcoal">
                      {booking.venue === 'home' ? (
                        <HomeIcon className="mt-1 h-5 w-5 shrink-0 text-palm" />
                      ) : (
                        <StoreIcon className="mt-1 h-5 w-5 shrink-0 text-palm" />
                      )}
                      <span>
                        {booking.venue === 'home' ? 'Home visit' : 'At the shop'}
                        {booking.venue === 'home' && booking.address ? (
                          <span className="block text-[1.05rem] text-charcoal-soft">
                            {booking.address}
                          </span>
                        ) : null}
                      </span>
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-[0.95rem] font-bold uppercase tracking-wide2 text-stone">
                      Services
                    </dt>
                    <dd className="mt-2">
                      <ul className="space-y-1.5">
                        {booking.services.map((service, i) => (
                          <li
                            key={`${service.id}-${i}`}
                            className="flex justify-between gap-4 text-[1.1rem] text-charcoal"
                          >
                            <span>{service.name}</span>
                            <span className="font-bold">{formatAED(service.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>

                  {booking.notes ? (
                    <div className="sm:col-span-2">
                      <dt className="text-[0.95rem] font-bold uppercase tracking-wide2 text-stone">
                        Notes from the customer
                      </dt>
                      <dd className="mt-1 whitespace-pre-line text-[1.1rem] text-charcoal">
                        {booking.notes}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {/* Money */}
                <div className="mt-6 rounded-xl bg-linen p-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                    <span className="text-[1.05rem] text-charcoal-soft">
                      Services {formatAED(booking.subtotal)}
                      {booking.travelFee > 0 ? ` · Travel ${formatAED(booking.travelFee)}` : ''}
                      {booking.discount > 0
                        ? ` · Discount −${formatAED(booking.discount)} (${booking.promoCode})`
                        : ''}
                    </span>
                    <span className="text-[1.5rem] font-bold text-palm">
                      {formatAED(booking.total)}
                    </span>
                  </div>

                  <p className="mt-3 text-[1.05rem] font-bold">
                    {booking.paymentStatus === 'paid' ? (
                      <span className="text-palm">
                        Deposit paid online{booking.depositDue > 0 ? `: ${formatAED(booking.depositDue)}` : ''}
                        {booking.total - booking.depositDue > 0
                          ? `, ${formatAED(booking.total - booking.depositDue)} to collect`
                          : ''}
                      </span>
                    ) : booking.paymentStatus === 'refunded' ? (
                      <span className="text-charcoal">Refunded</span>
                    ) : (
                      <span className="text-terracotta-dark">
                        Not paid yet, collect {formatAED(booking.total)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {booking.status === 'new' ? (
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => setStatus(booking, 'confirmed')}
                      className="a-btn-primary"
                    >
                      <CheckIcon className="h-5 w-5" />
                      Confirm this booking
                    </button>
                  ) : null}

                  {booking.status === 'confirmed' ? (
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => setStatus(booking, 'completed')}
                      className="a-btn-primary"
                    >
                      <CheckIcon className="h-5 w-5" />
                      Mark as finished
                    </button>
                  ) : null}

                  <a
                    href={`tel:${booking.phone}`}
                    className="a-btn-secondary"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    Call
                  </a>

                  <a
                    href={whatsappLink(
                      booking.phone,
                      `Hello ${booking.name}, this is AJ about your booking ${booking.ref} on ${formatDateLong(booking.date, 'en')} at ${formatSlot(booking.time, 'en')}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="a-btn-secondary"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    WhatsApp
                  </a>

                  {booking.status === 'new' || booking.status === 'confirmed' ? (
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => setConfirming({ booking, action: 'cancel' })}
                      className="a-btn-danger"
                    >
                      Cancel booking
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={busyId === booking.id}
                    onClick={() => setConfirming({ booking, action: 'delete' })}
                    className="a-btn-danger"
                  >
                    <TrashIcon className="h-5 w-5" />
                    Delete
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title={
          confirming?.action === 'delete'
            ? `Delete ${confirming.booking.name}'s booking?`
            : `Cancel ${confirming?.booking.name ?? ''}'s booking?`
        }
        body={
          confirming?.action === 'delete'
            ? 'This removes it from your list completely. You will not be able to get it back.'
            : 'The booking will be marked as cancelled and the time slot will be free again.'
        }
        confirmLabel={confirming?.action === 'delete' ? 'Yes, delete it' : 'Yes, cancel it'}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (!confirming) return;
          if (confirming.action === 'delete') void remove(confirming.booking);
          else void setStatus(confirming.booking, 'cancelled');
        }}
      />
    </div>
  );
}
