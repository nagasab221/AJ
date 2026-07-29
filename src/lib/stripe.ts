/**
 * Stripe on the Cloudflare Workers runtime.
 *
 * Two Workers-specific details:
 *   • the SDK must use the fetch HTTP client, not Node's http module
 *   • webhook signatures must be verified with the async / SubtleCrypto path
 *
 * Stripe is entirely optional. When STRIPE_SECRET_KEY is absent the booking
 * flow hides the "pay now" option and every booking is recorded as unpaid,
 * "pay at the shop".
 */
import Stripe from 'stripe';

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

let cached: Stripe | null = null;

export function stripeClient(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY).');
    cached = new Stripe(key, {
      // Required on Workers: the default Node HTTP client is unavailable.
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 2,
      appInfo: { name: 'AJ Barbershop' }
    });
  }
  return cached;
}

let cryptoProvider: ReturnType<typeof Stripe.createSubtleCryptoProvider> | null = null;

/**
 * Verify a webhook payload. Uses constructEventAsync because SubtleCrypto's
 * digest API is async, the synchronous constructEvent throws on Workers.
 */
export async function verifyWebhook(
  rawBody: string,
  signature: string | null
): Promise<Stripe.Event | null> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return null;
  if (!cryptoProvider) cryptoProvider = Stripe.createSubtleCryptoProvider();

  try {
    return await stripeClient().webhooks.constructEventAsync(
      rawBody,
      signature,
      secret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err);
    return null;
  }
}
