'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface BookingContextValue {
  selected: string[];
  isSelected: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

/**
 * Holds the chosen service ids so the Services section and the booking form
 * stay in sync — tapping "Add to booking" on a card ticks the same service in
 * the form further down the page.
 */
export default function BookingProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);

  const add = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const remove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const value = useMemo<BookingContextValue>(
    () => ({
      selected,
      isSelected: (id: string) => selected.includes(id),
      add,
      remove,
      toggle,
      clear
    }),
    [selected, add, remove, toggle, clear]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>');
  return ctx;
}
