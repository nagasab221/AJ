'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts a statistic up the first time it scrolls into view.
 *
 * Values are authored as free text in the admin ("4.9", "84", "8,000+"), so the
 * numeric part is animated and any prefix or suffix is left exactly as typed.
 * Anything without a number renders unchanged.
 */
export default function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<string>(value);
  const started = useRef(false);

  const match = value.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/s);

  useEffect(() => {
    if (!match) return;
    const node = ref.current;
    if (!node) return;

    const [, prefix, rawNumber, suffix] = match;
    const target = Number(rawNumber.replace(/,/g, ''));
    if (!Number.isFinite(target)) return;

    const decimals = rawNumber.includes('.') ? rawNumber.split('.')[1].length : 0;
    const grouped = rawNumber.includes(',');
    const format = (n: number) => {
      const fixed = n.toFixed(decimals);
      return grouped ? Number(fixed).toLocaleString('en-US', { minimumFractionDigits: decimals }) : fixed;
    };

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setDisplay(value);
      return;
    }

    // The real figure stays on screen until the moment the animation starts.
    // Zeroing on mount instead would leave a permanent "0" on any stat that
    // never scrolls into view, or in a tab the observer never services.
    let frame = 0;
    const run = () => {
      setDisplay(`${prefix}${format(0)}${suffix}`);
      const duration = 1100;
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        // Ease out, so it decelerates into the final figure.
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(`${prefix}${format(target * eased)}${suffix}`);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            run();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, match]);

  return (
    <span ref={ref} className={className}>
      {match ? display : value}
    </span>
  );
}
