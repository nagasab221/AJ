import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Karla, Playfair_Display } from 'next/font/google';
import '@/app/globals.css';

const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
  title: 'AJ Owner area',
  robots: { index: false, follow: false },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // The owner area is pinned to the light theme: it was designed around
    // maximum contrast for a user who is not comfortable with software, and a
    // dark variant would undo that.
    <html
      lang="en"
      dir="ltr"
      data-theme="light"
      className={`${display.variable} ${body.variable} ${arabic.variable}`}
    >
      <body className="admin-scope">{children}</body>
    </html>
  );
}
