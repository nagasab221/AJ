/**
 * Admin authentication for /admin.
 *
 * One owner password (ADMIN_PASSWORD). A successful login sets an HttpOnly
 * cookie holding an expiry timestamp signed with HMAC-SHA256
 * (ADMIN_SESSION_SECRET). Built on the Web Crypto API so it runs on the
 * Cloudflare Workers runtime as well as Node, and crypto.subtle.verify does the
 * comparison in constant time.
 */
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'aj_admin_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, in seconds

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): ArrayBuffer | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  } catch {
    return null;
  }
}

async function hmacKey(): Promise<CryptoKey | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Value for the session cookie: "<expiryMs>.<signature>". */
export async function createSessionValue(): Promise<string> {
  const key = await hmacKey();
  if (!key) throw new Error('ADMIN_SESSION_SECRET is not set');
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(exp)));
  return `${exp}.${toBase64Url(sig)}`;
}

export async function verifySessionValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const key = await hmacKey();
  if (!key) return false;

  const dot = value.lastIndexOf('.');
  if (dot <= 0) return false;
  const exp = value.slice(0, dot);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;

  const sig = fromBase64Url(value.slice(dot + 1));
  if (!sig) return false;
  return crypto.subtle.verify('HMAC', key, sig, encoder.encode(exp));
}

/** Is the current request an authenticated admin? */
export async function isAdminRequest(): Promise<boolean> {
  return verifySessionValue(cookies().get(SESSION_COOKIE)?.value);
}

/** Constant-time password check against ADMIN_PASSWORD. */
export async function checkPassword(candidate: string): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD;
  const key = await hmacKey();
  if (!real || !key) return false;
  // verify(HMAC(real), candidate) — true only when the strings match.
  const sigOfReal = await crypto.subtle.sign('HMAC', key, encoder.encode(real));
  return crypto.subtle.verify('HMAC', key, sigOfReal, encoder.encode(candidate));
}
