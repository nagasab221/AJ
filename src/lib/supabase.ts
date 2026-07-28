/**
 * Server-side Supabase access.
 *
 * The site talks to Supabase exclusively from route handlers and server
 * components using the service-role key. The browser never receives a Supabase
 * credential, and every table has RLS enabled with no public policies, so a
 * leaked anon key would still reach nothing.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let cached: SupabaseClient | null = null;

/** Lazily created — env vars are injected per-request on Cloudflare Workers. */
export function supabase(): SupabaseClient {
  if (!cached) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
    }
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Always read fresh: the promise of the admin panel is that an edit shows
      // up on the next page load. Without this Next.js caches the REST fetch and
      // serves stale content until the next deploy.
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' })
      }
    });
  }
  return cached;
}

/** Public URL prefix of the `uploads` storage bucket (empty when unconfigured). */
export function uploadsPublicPrefix(): string {
  const url = process.env.SUPABASE_URL;
  return url ? `${url.replace(/\/+$/, '')}/storage/v1/object/public/uploads/` : '';
}
