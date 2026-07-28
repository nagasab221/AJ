'use client';

import { useCallback, useEffect, useState } from 'react';
import BannerPanel from '@/components/admin/BannerPanel';
import BookingsPanel from '@/components/admin/BookingsPanel';
import PromosPanel from '@/components/admin/PromosPanel';
import {
  GalleryPanel,
  HoursPanel,
  ReviewsPanel,
  ServicesPanel,
  TextPanel
} from '@/components/admin/ContentPanels';
import { SaveBar } from '@/components/admin/ui';
import { Wordmark } from '@/components/Monogram';
import { AlertIcon, MenuIcon, CloseIcon } from '@/components/Icons';
import { cx } from '@/lib/utils';
import type { BannerSettings, PromoCode, SiteContent, StoredReservation } from '@/lib/types';

type PageKey =
  | 'new'
  | 'bookings'
  | 'services'
  | 'promos'
  | 'banner'
  | 'photos'
  | 'reviews'
  | 'text'
  | 'hours';

const PAGES: Array<{ key: PageKey; label: string; group: string }> = [
  { key: 'new', label: 'New bookings', group: 'Every day' },
  { key: 'bookings', label: 'All bookings', group: 'Every day' },
  { key: 'promos', label: 'Discount codes', group: 'Every day' },
  { key: 'banner', label: 'Top banner', group: 'Every day' },
  { key: 'services', label: 'Services & prices', group: 'Your website' },
  { key: 'photos', label: 'Photos of your work', group: 'Your website' },
  { key: 'reviews', label: 'Customer reviews', group: 'Your website' },
  { key: 'text', label: 'Website text', group: 'Your website' },
  { key: 'hours', label: 'Opening hours', group: 'Your website' }
];

/** Pages that edit the shared content document and therefore need a Save bar. */
const CONTENT_PAGES: PageKey[] = ['services', 'photos', 'reviews', 'text', 'hours'];

export default function AdminDashboard({
  initialContent,
  initialBanner
}: {
  initialContent: SiteContent;
  initialBanner: BannerSettings;
}) {
  const [page, setPage] = useState<PageKey>('new');
  const [navOpen, setNavOpen] = useState(false);

  const [content, setContent] = useState<SiteContent>(initialContent);
  const [banner, setBanner] = useState<BannerSettings>(initialBanner);
  const [reservations, setReservations] = useState<StoredReservation[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loadError, setLoadError] = useState('');

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'idle' | 'saved' | 'error'; message?: string }>({
    kind: 'idle'
  });

  const loadReservations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reservations');
      const data = (await res.json()) as { ok?: boolean; reservations?: StoredReservation[]; error?: string };
      if (data.ok && data.reservations) setReservations(data.reservations);
      else if (data.error) setLoadError(data.error);
    } catch {
      setLoadError('Could not load your bookings. Check your internet connection.');
    }
  }, []);

  const loadPromos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/promos');
      const data = (await res.json()) as { ok?: boolean; promos?: PromoCode[] };
      if (data.ok && data.promos) setPromos(data.promos);
    } catch {
      /* the panel simply shows an empty list */
    }
  }, []);

  const loadBanner = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/banner');
      const data = (await res.json()) as { ok?: boolean; banner?: BannerSettings };
      if (data.ok && data.banner) setBanner(data.banner);
    } catch {
      /* keep whatever the server rendered with */
    }
  }, []);

  useEffect(() => {
    void loadReservations();
    void loadPromos();
  }, [loadReservations, loadPromos]);

  // Reset the "Saved" note whenever the page changes.
  useEffect(() => {
    setStatus({ kind: 'idle' });
    setNavOpen(false);
  }, [page]);

  async function saveContent() {
    setSaving(true);
    setStatus({ kind: 'idle' });

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (data.ok) setStatus({ kind: 'saved' });
      else setStatus({ kind: 'error', message: data.error ?? 'Could not save.' });
    } catch {
      setStatus({ kind: 'error', message: 'Could not save. Check your internet connection.' });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.reload();
  }

  const newCount = reservations.filter((r) => r.status === 'new').length;
  const groups = Array.from(new Set(PAGES.map((p) => p.group)));

  const nav = (
    <nav className="space-y-7">
      {groups.map((group) => (
        <div key={group}>
          <h2 className="mb-2 px-5 text-[0.9rem] font-bold uppercase tracking-wide2 text-stone">
            {group}
          </h2>
          <ul className="space-y-1.5">
            {PAGES.filter((p) => p.group === group).map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setPage(item.key)}
                  aria-current={page === item.key ? 'page' : undefined}
                  className={cx('a-nav-item', page === item.key && 'a-nav-active')}
                >
                  <span className="flex-1">{item.label}</span>
                  {item.key === 'new' && newCount > 0 ? (
                    <span
                      className={cx(
                        'rounded-full px-3 py-0.5 text-[0.95rem] font-bold',
                        page === 'new' ? 'bg-white text-palm' : 'bg-terracotta text-white'
                      )}
                    >
                      {newCount}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="border-t-2 border-dune pt-5">
        <a href="/en" target="_blank" rel="noreferrer" className="a-nav-item">
          Look at my website
        </a>
        <button type="button" onClick={logout} className="a-nav-item">
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="admin-scope min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b-2 border-dune-dark bg-linen/95 backdrop-blur">
        <div className="mx-auto flex max-w-[95rem] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Wordmark subtitle="Owner area" />
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            className="a-btn-secondary lg:hidden"
            aria-expanded={navOpen}
          >
            {navOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            Menu
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[95rem] gap-10 px-4 py-8 sm:px-6">
        {/* Sidebar */}
        <aside className="hidden w-[19rem] shrink-0 lg:block">
          <div className="sticky top-28">{nav}</div>
        </aside>

        {navOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-charcoal/50"
              onClick={() => setNavOpen(false)}
            />
            <div className="absolute inset-y-0 start-0 w-[85vw] max-w-sm overflow-y-auto border-e-2 border-dune-dark bg-linen p-5">
              {nav}
            </div>
          </div>
        ) : null}

        {/* Main */}
        <main className="min-w-0 flex-1 pb-16">
          {loadError ? (
            <p className="mb-8 flex items-start gap-3 rounded-xl bg-terracotta-mist px-5 py-4 text-[1.05rem] font-bold text-terracotta-dark">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
              {loadError}
            </p>
          ) : null}

          {page === 'new' ? (
            <BookingsPanel
              reservations={reservations}
              onChanged={loadReservations}
              initialFilter="new"
            />
          ) : null}

          {page === 'bookings' ? (
            <BookingsPanel
              reservations={reservations}
              onChanged={loadReservations}
              initialFilter="all"
            />
          ) : null}

          {page === 'promos' ? <PromosPanel promos={promos} onChanged={loadPromos} /> : null}

          {page === 'banner' ? <BannerPanel banner={banner} onChanged={loadBanner} /> : null}

          {page === 'services' ? <ServicesPanel content={content} onChange={setContent} /> : null}
          {page === 'photos' ? <GalleryPanel content={content} onChange={setContent} /> : null}
          {page === 'reviews' ? <ReviewsPanel content={content} onChange={setContent} /> : null}
          {page === 'text' ? <TextPanel content={content} onChange={setContent} /> : null}
          {page === 'hours' ? <HoursPanel content={content} onChange={setContent} /> : null}

          {CONTENT_PAGES.includes(page) ? (
            <SaveBar onSave={saveContent} saving={saving} status={status} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
