import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Instrument_Serif, Karla } from 'next/font/google';
import '@/app/globals.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap'
});

const body = Karla({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

// Loaded here too: the admin types Arabic content into half of its fields.
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'AJ — Owner area',
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${display.variable} ${body.variable} ${arabic.variable}`}>
      <body className="admin-scope">{children}</body>
    </html>
  );
}
