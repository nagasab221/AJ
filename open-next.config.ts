import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Default OpenNext → Cloudflare Workers config. No incremental cache / queue is
// configured: every page reads its content from Supabase per request (all pages
// are force-dynamic), so there is nothing worth caching at the adapter level.
export default defineCloudflareConfig();
