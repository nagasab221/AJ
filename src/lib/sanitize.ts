/**
 * Input hygiene for anything that reaches the database, Telegram or WhatsApp.
 * Everything user-submitted goes through here first.
 */

const TAB = 9;
const LF = 10;
const CR = 13;

/**
 * Replace C0/C1 control characters with spaces. Done by code point rather than
 * a regex range so no invisible characters ever live in this file.
 * `keepBreaks` preserves tabs and newlines for multiline fields.
 */
function stripControl(input: string, keepBreaks: boolean): string {
  let out = '';
  for (const ch of input) {
    const c = ch.codePointAt(0) as number;
    const isControl = c < 32 || (c >= 127 && c <= 159);
    if (!isControl) {
      out += ch;
    } else if (keepBreaks && (c === TAB || c === LF)) {
      out += ch;
    } else if (keepBreaks && c === CR) {
      out += '\n';
    } else {
      out += ' ';
    }
  }
  return out;
}

/** Collapse whitespace, strip control characters, and cap the length. */
export function clean(input: unknown, maxLength = 200): string {
  if (typeof input !== 'string') return '';
  return stripControl(input, false).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Same as clean() but keeps line breaks (notes, addresses, messages). */
export function cleanMultiline(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return stripControl(input, true)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

export function cleanEmail(input: unknown): string {
  const s = clean(input, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s) ? s : '';
}

/** Promo codes are compared case-insensitively and stored upper-case. */
export function cleanPromoCode(input: unknown): string {
  return clean(input, 32).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

/** Only allow links we are willing to render as an announcement banner href. */
export function cleanLink(input: unknown): string {
  const s = clean(input, 500);
  if (!s) return '';
  if (s.startsWith('#') || s.startsWith('/')) return s;
  return /^https?:\/\//i.test(s) ? s : '';
}

/** A non-negative number from form input, clamped and rounded. */
export function cleanNumber(input: unknown, opts: { min?: number; max?: number; round?: boolean } = {}): number {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, round = false } = opts;
  const n = typeof input === 'number' ? input : Number(String(input ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n)) return min;
  const clamped = Math.min(Math.max(n, min), max);
  return round ? Math.round(clamped) : Math.round(clamped * 100) / 100;
}
