'use client';

import { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/Icons';
import { addDaysISO, dubaiTodayISO, MAX_ADVANCE_DAYS, slotsForDate } from '@/lib/booking';
import { cx } from '@/lib/utils';
import type { BookingSettings, Locale } from '@/lib/types';

const WEEKDAYS: Record<Locale, string[]> = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
};

function monthLabel(year: number, month: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month, 1)));
}

function iso(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Month picker. A day is only selectable when it actually has a free slot long
 * enough for the chosen services, so nobody picks a date and then finds an
 * empty time list.
 */
export default function Calendar({
  settings,
  value,
  onChange,
  locale,
  neededMinutes,
  takenByDate
}: {
  settings: BookingSettings;
  value: string;
  onChange: (date: string) => void;
  locale: Locale;
  neededMinutes: number;
  takenByDate?: Record<string, string[]>;
}) {
  const today = dubaiTodayISO();
  const lastDate = addDaysISO(today, MAX_ADVANCE_DAYS);
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1];
  const [cursor, setCursor] = useState(() => ({ year: ty, month: tm }));

  const { year, month } = cursor;
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const currentMonthStart = `${today.slice(0, 7)}-01`;
  const canGoBack = iso(year, month, 1) > currentMonthStart;
  const canGoForward = iso(year, month, 1) < lastDate;

  const days = useMemo(() => {
    const out: Array<{ date: string; day: number; disabled: boolean } | null> = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = iso(year, month, day);
      const withinRange = date >= today && date <= lastDate;
      const free = withinRange
        ? slotsForDate(settings, date, neededMinutes).filter(
            (slot) => !(takenByDate?.[date] ?? []).includes(slot)
          )
        : [];
      out.push({ date, day, disabled: !withinRange || free.length === 0 });
    }
    return out;
  }, [year, month, firstWeekday, daysInMonth, today, lastDate, settings, neededMinutes, takenByDate]);

  function step(delta: number) {
    setCursor((prev) => {
      const next = new Date(Date.UTC(prev.year, prev.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  return (
    <div className="rounded-2xl border border-dune-dark bg-paper p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="rounded-full border border-dune-dark p-2 text-charcoal transition-colors hover:border-palm hover:text-palm disabled:opacity-30"
        >
          <ChevronLeftIcon className="h-4 w-4 flip-rtl" />
        </button>

        <span className="font-display text-lg text-charcoal">{monthLabel(year, month, locale)}</span>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canGoForward}
          aria-label="Next month"
          className="rounded-full border border-dune-dark p-2 text-charcoal transition-colors hover:border-palm hover:text-palm disabled:opacity-30"
        >
          <ChevronRightIcon className="h-4 w-4 flip-rtl" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS[locale].map((label, i) => (
          <span key={i} className="py-2 text-[0.7rem] font-semibold uppercase text-stone-light">
            {label}
          </span>
        ))}

        {days.map((cell, i) =>
          cell === null ? (
            <span key={`pad-${i}`} />
          ) : (
            <button
              key={cell.date}
              type="button"
              disabled={cell.disabled}
              onClick={() => onChange(cell.date)}
              aria-pressed={value === cell.date}
              className={cx(
                'flex h-11 items-center justify-center rounded-xl text-[0.95rem] font-semibold transition-colors duration-200',
                value === cell.date
                  ? 'bg-palm text-linen'
                  : cell.disabled
                    ? 'cursor-not-allowed text-stone-light/60 line-through decoration-1'
                    : 'text-charcoal hover:bg-palm-mist hover:text-palm'
              )}
            >
              {cell.day}
            </button>
          )
        )}
      </div>
    </div>
  );
}
