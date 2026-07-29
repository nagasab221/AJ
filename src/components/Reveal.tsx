'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/utils';

/**
 * Fades a block up the first time it scrolls into view. Content is rendered
 * immediately either way, the animation is decoration, never a gate on the
 * text being present for crawlers or screen readers.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div'
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cx('transition-none', shown && 'animate-rise-in', className)}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
