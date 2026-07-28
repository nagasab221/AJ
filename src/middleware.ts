import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Localize everything except API routes, the admin panel and static assets.
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)']
};
