'use client';

import { useEffect, useRef, useState } from 'react';

/** "8,000+" splits into prefix "", number "8,000", suffix "+". */
const NUMERIC = /^(\D*)([\d,]+(?:\.\d+)?)(.*)$/s;

/**
 * Counts a statistic up the first time it scrolls into view.
 *
 * Values are authored as free text in the admin ("4.9", "84", "8,000+"), so only
 * the numeric part animates and any prefix or suffix is left exactly as typed.
 * Anything without a number renders unchanged.
 */
export default function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    // The real figure is what shows unless an animation actually takes over, so
    // a stat that never animates is still correct rather than stuck at zero.
    setDisplay(value);

    const node = ref.current;
    const match = value.match(NUMERIC);
    if (!node || !match) return;

    const [, prefix, rawNumber, suffix] = match;
    const target = Number(rawNumber.replace(/,/g, ''));
    if (!Number.isFinite(target)) return;

    const decimals = rawNumber.includes('.') ? rawNumber.split('.')[1].length : 0;
    const grouped = rawNumber.includes(',');
    const format = (n: number) => {
      const fixed = n.toFixed(decimals);
      return grouped
        ? Number(fixed).toLocaleString('en-US', { minimumFractionDigits: decimals })
        : fixed;
    };

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') return;

    let frame = 0;

    const run = () => {
      // A hidden tab does not service requestAnimationFrame, so starting here
      // would paint a zero and then freeze on it. Leave the real figure instead.
      if (document.hidden) return;

      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / 1100, 1);
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
          if (entry.isIntersecting) {
            observer.disconnect();
            run();
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
    // `value` only. Deriving the match during render and listing it here made
    // this effect re-run on every state update, and its cleanup cancelled the
    // very frame the counter had just scheduled, freezing every stat at zero.
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
