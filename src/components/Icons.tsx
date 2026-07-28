/**
 * Inline icon set. All 24×24, 1.6 stroke, currentColor — no icon library and
 * no extra network request. Icons that point somewhere carry `flip-rtl` at the
 * call site so they mirror in Arabic.
 */
type Props = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
};

export function WhatsAppIcon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.9 2.4 1.02 2.56c.12.17 1.75 2.67 4.25 3.75.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29z" />
    </svg>
  );
}

export function InstagramIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.5 3c.3 2.1 1.5 3.4 3.5 3.6v2.6c-1.2.1-2.3-.2-3.5-.9v5.9c0 4.3-3.4 6.6-6.6 5.6-2.6-.8-4-3.3-3.6-5.9.4-2.4 2.5-4.1 4.9-4v2.8c-.4.1-.8.2-1.1.4-1 .5-1.5 1.6-1.2 2.6.3 1.1 1.4 1.8 2.5 1.6 1.2-.2 2-1.2 2-2.5V3h3.1z" />
    </svg>
  );
}

export function PhoneIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5c0-.6.4-1 1-1h2.4c.5 0 .9.3 1 .8l.8 3c.1.4-.1.8-.4 1L7.2 10a12 12 0 0 0 5 5l1.2-1.6c.2-.3.6-.5 1-.4l3 .8c.5.1.8.5.8 1V17c0 .6-.4 1-1 1h-1C9.7 18 4 12.3 4 5z" />
    </svg>
  );
}

export function MailIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function MapPinIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s7-5.3 7-10.5A7 7 0 0 0 5 10.5C5 15.7 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.6" />
    </svg>
  );
}

export function ClockIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12h15m0 0-6-6m6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function PlusIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function MenuIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function StarIcon({ className, filled = true }: Props & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.4}
      aria-hidden
      className={className}
    >
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" />
    </svg>
  );
}

export function ScissorsIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.1 7.4 20 18M20 6 8.1 16.6" />
    </svg>
  );
}

export function CalendarIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3.5V6m8-2.5V6" />
    </svg>
  );
}

export function TagIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 11.4V4.8c0-.7.6-1.3 1.3-1.3h6.6c.3 0 .7.1.9.4l8 8c.5.5.5 1.3 0 1.8l-6.6 6.6c-.5.5-1.3.5-1.8 0l-8-8a1.3 1.3 0 0 1-.4-.9z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrashIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 7h15M9.5 7V5.5c0-.6.4-1 1-1h3c.6 0 1 .4 1 1V7m3 0-.7 12.1c0 .5-.5.9-1 .9H7.2c-.5 0-1-.4-1-.9L5.5 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </svg>
  );
}

export function EditIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
    </svg>
  );
}

export function AlertIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.2" />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CardIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19M6 15h4" />
    </svg>
  );
}

export function HomeIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5.5H9V20H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function StoreIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" />
      <path d="M3 6.5 4.4 4h15.2L21 6.5a2.6 2.6 0 0 1-4.5 2.4 2.6 2.6 0 0 1-4.5 0 2.6 2.6 0 0 1-4.5 0A2.6 2.6 0 0 1 3 6.5z" />
    </svg>
  );
}
