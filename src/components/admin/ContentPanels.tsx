'use client';

import { useState } from 'react';
import { BilingualField, ConfirmDialog, Field, ImagePicker, TextInput, Toggle } from '@/components/admin/ui';
import { PlusIcon, TrashIcon } from '@/components/Icons';
import { cx, makeId } from '@/lib/utils';
import {
  DAY_KEYS,
  SERVICE_CATEGORIES,
  VENUES,
  type DayKey,
  type GalleryItem,
  type L,
  type Service,
  type ServiceCategory,
  type SiteContent,
  type Testimonial,
  type Venue
} from '@/lib/types';

/** Panels that edit the one site-content document. */
type Props = {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
};

const EMPTY_L: L = { en: '', ar: '' };

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  hair: 'Hair',
  beard: 'Beard',
  combo: 'Packages',
  kids: 'Kids',
  addon: 'Extras'
};

const VENUE_LABEL: Record<Venue, string> = {
  both: 'Shop and home visits',
  shop: 'Only at the shop',
  home: 'Only home visits'
};

const DAY_LABEL: Record<DayKey, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday'
};

// ── Services & prices ───────────────────────────────────────────────────────

export function ServicesPanel({ content, onChange }: Props) {
  const [openId, setOpenId] = useState<string>('');
  const [deleting, setDeleting] = useState<Service | null>(null);

  function update(id: string, patch: Partial<Service>) {
    onChange({
      ...content,
      services: content.services.map((s) => (s.id === id ? { ...s, ...patch } : s))
    });
  }

  function add() {
    const service: Service = {
      id: makeId('svc'),
      name: { en: 'New service', ar: 'خدمة جديدة' },
      price: 50,
      duration: 30,
      description: EMPTY_L,
      category: 'hair',
      venue: 'both',
      image: null
    };
    onChange({ ...content, services: [...content.services, service] });
    setOpenId(service.id);
  }

  function remove(service: Service) {
    onChange({ ...content, services: content.services.filter((s) => s.id !== service.id) });
    setDeleting(null);
  }

  return (
    <div>
      <h1 className="a-h1">Services &amp; prices</h1>
      <p className="mt-3 max-w-2xl text-[1.1rem] text-charcoal-soft">
        Everything a customer can book. Tap a service to change its name, price or how long it
        takes. Remember to press Save at the bottom when you are done.
      </p>

      <ul className="mt-8 space-y-4">
        {content.services.map((service) => {
          const open = openId === service.id;
          return (
            <li key={service.id}>
              <article className="a-card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-[1.4rem] font-bold text-charcoal">
                      {service.name.en || 'Untitled service'}
                    </h2>
                    <p className="mt-1 text-[1.05rem] text-charcoal-soft">
                      AED {service.price} · {service.duration} minutes ·{' '}
                      {CATEGORY_LABEL[service.category]}
                      {service.popular ? ' · Most booked' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? '' : service.id)}
                    className="a-btn-secondary"
                  >
                    {open ? 'Close' : 'Change this'}
                  </button>
                </div>

                {open ? (
                  <div className="mt-7 space-y-7 border-t-2 border-dune pt-7">
                    <BilingualField
                      id={`svc-name-${service.id}`}
                      label="Name of the service"
                      value={service.name}
                      onChange={(name) => update(service.id, { name })}
                    />

                    <BilingualField
                      id={`svc-desc-${service.id}`}
                      label="Short description"
                      hint="One or two lines about what the customer gets."
                      value={service.description}
                      onChange={(description) => update(service.id, { description })}
                      multiline
                    />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <Field label="Price in dirhams" htmlFor={`svc-price-${service.id}`}>
                        <TextInput
                          id={`svc-price-${service.id}`}
                          value={String(service.price)}
                          onChange={(price) =>
                            update(service.id, { price: Number(price.replace(/[^\d.]/g, '')) || 0 })
                          }
                          inputMode="decimal"
                          dir="ltr"
                        />
                      </Field>

                      <Field
                        label="How many minutes"
                        hint="Used to work out free times in the calendar."
                        htmlFor={`svc-duration-${service.id}`}
                      >
                        <TextInput
                          id={`svc-duration-${service.id}`}
                          value={String(service.duration)}
                          onChange={(duration) =>
                            update(service.id, {
                              duration: Number(duration.replace(/[^\d]/g, '')) || 0
                            })
                          }
                          inputMode="numeric"
                          dir="ltr"
                        />
                      </Field>

                      <Field label="Group it belongs to" htmlFor={`svc-cat-${service.id}`}>
                        <select
                          id={`svc-cat-${service.id}`}
                          className="a-input"
                          value={service.category}
                          onChange={(e) =>
                            update(service.id, { category: e.target.value as ServiceCategory })
                          }
                        >
                          {SERVICE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {CATEGORY_LABEL[cat]}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Where you can do this service" htmlFor={`svc-venue-${service.id}`}>
                      <select
                        id={`svc-venue-${service.id}`}
                        className="a-input"
                        value={service.venue ?? 'both'}
                        onChange={(e) => update(service.id, { venue: e.target.value as Venue })}
                      >
                        {VENUES.map((venue) => (
                          <option key={venue} value={venue}>
                            {VENUE_LABEL[venue]}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Toggle
                      label='Show the "Most booked" badge'
                      hint="Use this on one or two services to draw the eye."
                      checked={Boolean(service.popular)}
                      onChange={(popular) => update(service.id, { popular })}
                    />

                    <ImagePicker
                      label="Picture (optional)"
                      value={service.image ?? ''}
                      onChange={(image) => update(service.id, { image: image || null })}
                    />

                    <div className="border-t-2 border-dune pt-6">
                      <button
                        type="button"
                        onClick={() => setDeleting(service)}
                        className="a-btn-danger"
                      >
                        <TrashIcon className="h-5 w-5" />
                        Remove this service
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={add} className="a-btn-primary mt-6">
        <PlusIcon className="h-5 w-5" />
        Add a service
      </button>

      <ConfirmDialog
        open={deleting !== null}
        title={`Remove "${deleting?.name.en ?? ''}"?`}
        body="It will disappear from your website as soon as you press Save."
        confirmLabel="Yes, remove it"
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}

// ── Photos ──────────────────────────────────────────────────────────────────

export function GalleryPanel({ content, onChange }: Props) {
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);

  function update(id: string, patch: Partial<GalleryItem>) {
    onChange({
      ...content,
      gallery: content.gallery.map((g) => (g.id === id ? { ...g, ...patch } : g))
    });
  }

  return (
    <div>
      <h1 className="a-h1">Photos of your work</h1>
      <p className="mt-3 max-w-2xl text-[1.1rem] text-charcoal-soft">
        These appear in the &quot;Recent cuts&quot; part of your website. Six photos look best.
      </p>

      <ul className="mt-8 space-y-4">
        {content.gallery.map((item) => (
          <li key={item.id}>
            <article className="a-card space-y-6">
              <ImagePicker
                value={item.image}
                onChange={(image) => update(item.id, { image })}
                label="Photo"
              />
              <BilingualField
                id={`gal-${item.id}`}
                label="Caption under the photo"
                value={item.caption}
                onChange={(caption) => update(item.id, { caption })}
              />
              <button type="button" onClick={() => setDeleting(item)} className="a-btn-danger">
                <TrashIcon className="h-5 w-5" />
                Remove this photo
              </button>
            </article>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() =>
          onChange({
            ...content,
            gallery: [...content.gallery, { id: makeId('gal'), caption: EMPTY_L, image: '' }]
          })
        }
        className="a-btn-primary mt-6"
      >
        <PlusIcon className="h-5 w-5" />
        Add a photo
      </button>

      <ConfirmDialog
        open={deleting !== null}
        title="Remove this photo?"
        body="It will disappear from your website as soon as you press Save."
        confirmLabel="Yes, remove it"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          onChange({ ...content, gallery: content.gallery.filter((g) => g.id !== deleting.id) });
          setDeleting(null);
        }}
      />
    </div>
  );
}

// ── Reviews ─────────────────────────────────────────────────────────────────

export function ReviewsPanel({ content, onChange }: Props) {
  const [deleting, setDeleting] = useState<Testimonial | null>(null);

  function update(id: string, patch: Partial<Testimonial>) {
    onChange({
      ...content,
      testimonials: content.testimonials.map((x) => (x.id === id ? { ...x, ...patch } : x))
    });
  }

  return (
    <div>
      <h1 className="a-h1">Customer reviews</h1>
      <p className="mt-3 max-w-2xl text-[1.1rem] text-charcoal-soft">
        Four reviews are shown on the website. Type them in exactly as the customer wrote them.
      </p>

      <ul className="mt-8 space-y-4">
        {content.testimonials.map((review) => (
          <li key={review.id}>
            <article className="a-card space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Field label="Customer's name" htmlFor={`rev-name-${review.id}`}>
                  <TextInput
                    id={`rev-name-${review.id}`}
                    value={review.name}
                    onChange={(name) => update(review.id, { name })}
                  />
                </Field>

                <Field label="Stars out of 5" htmlFor={`rev-rating-${review.id}`}>
                  <select
                    id={`rev-rating-${review.id}`}
                    className="a-input"
                    value={review.rating}
                    onChange={(e) => update(review.id, { rating: Number(e.target.value) })}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} star{n === 1 ? '' : 's'}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <BilingualField
                id={`rev-quote-${review.id}`}
                label="What they said"
                value={review.quote}
                onChange={(quote) => update(review.id, { quote })}
                multiline
              />

              <button type="button" onClick={() => setDeleting(review)} className="a-btn-danger">
                <TrashIcon className="h-5 w-5" />
                Remove this review
              </button>
            </article>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() =>
          onChange({
            ...content,
            testimonials: [
              ...content.testimonials,
              { id: makeId('rev'), name: '', quote: EMPTY_L, rating: 5 }
            ]
          })
        }
        className="a-btn-primary mt-6"
      >
        <PlusIcon className="h-5 w-5" />
        Add a review
      </button>

      <ConfirmDialog
        open={deleting !== null}
        title={`Remove the review from ${deleting?.name || 'this customer'}?`}
        confirmLabel="Yes, remove it"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          onChange({
            ...content,
            testimonials: content.testimonials.filter((x) => x.id !== deleting.id)
          });
          setDeleting(null);
        }}
      />
    </div>
  );
}

// ── Website text ────────────────────────────────────────────────────────────

export function TextPanel({ content, onChange }: Props) {
  const site = content.site;

  function setSite(patch: Partial<typeof site>) {
    onChange({ ...content, site: { ...site, ...patch } });
  }

  return (
    <div>
      <h1 className="a-h1">Website text</h1>
      <p className="mt-3 max-w-2xl text-[1.1rem] text-charcoal-soft">
        The words on your home page, and how customers reach you.
      </p>

      <section className="a-card mt-8 space-y-7">
        <h2 className="a-h2">The top of the page</h2>
        <BilingualField
          id="hero-eyebrow"
          label="Small line above the heading"
          value={site.heroEyebrow}
          onChange={(heroEyebrow) => setSite({ heroEyebrow })}
        />
        <BilingualField
          id="hero-title"
          label="Big heading"
          value={site.heroTitle}
          onChange={(heroTitle) => setSite({ heroTitle })}
        />
        <BilingualField
          id="hero-subtitle"
          label="Sentence under the heading"
          value={site.heroSubtitle}
          onChange={(heroSubtitle) => setSite({ heroSubtitle })}
          multiline
        />
        <BilingualField
          id="tagline"
          label="Short tagline (next to your name at the top)"
          value={site.tagline}
          onChange={(tagline) => setSite({ tagline })}
        />
      </section>

      <section className="a-card mt-6 space-y-7">
        <h2 className="a-h2">About you</h2>
        <BilingualField
          id="about-heading"
          label="Heading"
          value={site.aboutHeading}
          onChange={(aboutHeading) => setSite({ aboutHeading })}
        />

        {site.aboutBody.map((para, i) => (
          <BilingualField
            key={i}
            id={`about-body-${i}`}
            label={`Paragraph ${i + 1}`}
            value={para}
            onChange={(next) =>
              setSite({ aboutBody: site.aboutBody.map((p, j) => (j === i ? next : p)) })
            }
            multiline
          />
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSite({ aboutBody: [...site.aboutBody, EMPTY_L] })}
            className="a-btn-secondary"
          >
            <PlusIcon className="h-5 w-5" />
            Add a paragraph
          </button>
          {site.aboutBody.length > 1 ? (
            <button
              type="button"
              onClick={() => setSite({ aboutBody: site.aboutBody.slice(0, -1) })}
              className="a-btn-secondary"
            >
              Remove the last paragraph
            </button>
          ) : null}
        </div>

        <div className="border-t-2 border-dune pt-7">
          <BilingualField
            id="barber-name"
            label="Your name as shown on the website"
            value={site.barberName}
            onChange={(barberName) => setSite({ barberName })}
          />
        </div>
        <BilingualField
          id="barber-role"
          label="Your title"
          value={site.barberRole}
          onChange={(barberRole) => setSite({ barberRole })}
        />
        <BilingualField
          id="barber-bio"
          label="The quote shown in large letters"
          value={site.barberBio}
          onChange={(barberBio) => setSite({ barberBio })}
          multiline
        />
      </section>

      <section className="a-card mt-6 space-y-7">
        <h2 className="a-h2">The four numbers</h2>
        <p className="text-[1.05rem] text-charcoal-soft">
          These appear next to your photo, years of experience, customers served, and so on.
        </p>

        {site.stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-1 gap-6 border-t-2 border-dune pt-6 lg:grid-cols-3">
            <Field label={`Number ${i + 1}`} htmlFor={`stat-value-${i}`}>
              <TextInput
                id={`stat-value-${i}`}
                value={stat.value}
                onChange={(value) =>
                  setSite({ stats: site.stats.map((s, j) => (j === i ? { ...s, value } : s)) })
                }
                dir="ltr"
              />
            </Field>
            <div className="lg:col-span-2">
              <BilingualField
                id={`stat-label-${i}`}
                label="What it means"
                value={stat.label}
                onChange={(label) =>
                  setSite({ stats: site.stats.map((s, j) => (j === i ? { ...s, label } : s)) })
                }
              />
            </div>
          </div>
        ))}
      </section>

      <section className="a-card mt-6 space-y-6">
        <h2 className="a-h2">How customers reach you</h2>

        <Field
          label="Phone number"
          hint="Write it with the country code, like +971501234567."
          htmlFor="site-phone"
        >
          <TextInput
            id="site-phone"
            value={site.phone}
            onChange={(phone) => setSite({ phone })}
            dir="ltr"
            inputMode="tel"
          />
        </Field>

        <Field
          label="WhatsApp number"
          hint="Usually the same as your phone number."
          htmlFor="site-whatsapp"
        >
          <TextInput
            id="site-whatsapp"
            value={site.whatsapp}
            onChange={(whatsapp) => setSite({ whatsapp })}
            dir="ltr"
            inputMode="tel"
          />
        </Field>

        <Field label="Email address" htmlFor="site-email">
          <TextInput
            id="site-email"
            value={site.email}
            onChange={(email) => setSite({ email })}
            dir="ltr"
            inputMode="email"
          />
        </Field>

        <Field label="Instagram link" htmlFor="site-instagram">
          <TextInput
            id="site-instagram"
            value={site.instagram}
            onChange={(instagram) => setSite({ instagram })}
            dir="ltr"
          />
        </Field>

        <Field label="TikTok link (leave empty if you have none)" htmlFor="site-tiktok">
          <TextInput
            id="site-tiktok"
            value={site.tiktok}
            onChange={(tiktok) => setSite({ tiktok })}
            dir="ltr"
          />
        </Field>
      </section>

      <section className="a-card mt-6 space-y-7">
        <h2 className="a-h2">The shop address</h2>
        <BilingualField
          id="location-address"
          label="Address"
          value={content.location.address}
          onChange={(address) =>
            onChange({ ...content, location: { ...content.location, address } })
          }
        />
        <BilingualField
          id="location-hours"
          label="Opening hours in one short line"
          hint="Shown under the address. The full week is set on the Opening hours page."
          value={content.location.hoursText}
          onChange={(hoursText) =>
            onChange({ ...content, location: { ...content.location, hoursText } })
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Field
            label="Map position, latitude"
            hint="From Google Maps: right-click your shop, and the two numbers appear at the top."
            htmlFor="location-lat"
          >
            <TextInput
              id="location-lat"
              value={String(content.location.lat)}
              onChange={(lat) =>
                onChange({
                  ...content,
                  location: { ...content.location, lat: Number(lat.replace(/[^\d.-]/g, '')) || 0 }
                })
              }
              dir="ltr"
              inputMode="decimal"
            />
          </Field>
          <Field label="Map position, longitude" htmlFor="location-lng">
            <TextInput
              id="location-lng"
              value={String(content.location.lng)}
              onChange={(lng) =>
                onChange({
                  ...content,
                  location: { ...content.location, lng: Number(lng.replace(/[^\d.-]/g, '')) || 0 }
                })
              }
              dir="ltr"
              inputMode="decimal"
            />
          </Field>
        </div>
      </section>
    </div>
  );
}

// ── Opening hours, area & deposit ───────────────────────────────────────────

export function HoursPanel({ content, onChange }: Props) {
  const booking = content.booking;
  const [newBlocked, setNewBlocked] = useState('');

  function setBooking(patch: Partial<typeof booking>) {
    onChange({ ...content, booking: { ...booking, ...patch } });
  }

  function setDay(day: DayKey, patch: { closed?: boolean; open?: string; close?: string }) {
    const existing = booking.workingHours.find((h) => h.day === day);
    const next = existing
      ? booking.workingHours.map((h) => (h.day === day ? { ...h, ...patch } : h))
      : [...booking.workingHours, { day, ...patch }];
    setBooking({ workingHours: next });
  }

  return (
    <div>
      <h1 className="a-h1">Opening hours &amp; booking rules</h1>
      <p className="mt-3 max-w-2xl text-[1.1rem] text-charcoal-soft">
        The website only offers customers times when you are open.
      </p>

      <section className="a-card mt-8">
        <h2 className="a-h2">Your week</h2>
        <ul className="mt-6 space-y-4">
          {DAY_KEYS.map((day) => {
            const hours = booking.workingHours.find((h) => h.day === day);
            const closed = !hours || hours.closed;
            return (
              <li
                key={day}
                className="flex flex-wrap items-center gap-4 border-t-2 border-dune pt-4 first:border-t-0 first:pt-0"
              >
                <span className="w-32 shrink-0 text-[1.15rem] font-bold text-charcoal">
                  {DAY_LABEL[day]}
                </span>

                <button
                  type="button"
                  onClick={() => setDay(day, { closed: !closed })}
                  className={cx(
                    'rounded-xl border-2 px-5 text-[1rem] font-bold transition-colors',
                    closed
                      ? 'border-charcoal/25 bg-white text-charcoal'
                      : 'border-palm bg-palm text-white'
                  )}
                  style={{ minHeight: '3.25rem', minWidth: '8rem' }}
                >
                  {closed ? 'Closed' : 'Open'}
                </button>

                {!closed ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      className="a-input"
                      style={{ width: '9rem' }}
                      value={hours?.open ?? '10:00'}
                      onChange={(e) => setDay(day, { open: e.target.value })}
                      aria-label={`${DAY_LABEL[day]} opening time`}
                    />
                    <span className="text-[1.1rem] text-charcoal">to</span>
                    <input
                      type="time"
                      className="a-input"
                      style={{ width: '9rem' }}
                      value={hours?.close ?? '22:00'}
                      onChange={(e) => setDay(day, { close: e.target.value })}
                      aria-label={`${DAY_LABEL[day]} closing time`}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="a-card mt-6">
        <h2 className="a-h2">Days you are away</h2>
        <p className="mt-2 text-[1.05rem] text-charcoal-soft">
          Add a date here and nobody can book on it, useful for holidays.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            type="date"
            className="a-input"
            style={{ width: '16rem' }}
            value={newBlocked}
            onChange={(e) => setNewBlocked(e.target.value)}
            aria-label="Date you are away"
          />
          <button
            type="button"
            disabled={!newBlocked}
            onClick={() => {
              if (!newBlocked) return;
              if (!booking.blockedDates.some((b) => b.date === newBlocked)) {
                setBooking({ blockedDates: [...booking.blockedDates, { date: newBlocked }] });
              }
              setNewBlocked('');
            }}
            className="a-btn-primary"
          >
            <PlusIcon className="h-5 w-5" />
            Add this day
          </button>
        </div>

        {booking.blockedDates.length ? (
          <ul className="mt-6 flex flex-wrap gap-3">
            {booking.blockedDates.map((blocked) => (
              <li key={blocked.date}>
                <button
                  type="button"
                  onClick={() =>
                    setBooking({
                      blockedDates: booking.blockedDates.filter((b) => b.date !== blocked.date)
                    })
                  }
                  className="flex items-center gap-2 rounded-xl border-2 border-charcoal/25 bg-white px-4 py-3 text-[1.05rem] font-bold text-charcoal hover:border-terracotta-dark hover:text-terracotta-dark"
                >
                  {blocked.date}
                  <TrashIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-[1.05rem] text-stone">No days blocked.</p>
        )}
      </section>

      <section className="a-card mt-6 space-y-7">
        <h2 className="a-h2">Home visits</h2>

        <Toggle
          label="The shop is open for bookings"
          hint="Turn this off if you are only doing home visits for a while."
          checked={booking.shopOpen}
          onChange={(shopOpen) => setBooking({ shopOpen })}
          onLabel="Open"
          offLabel="Closed"
        />

        <div className="border-t-2 border-dune pt-7">
          <BilingualField
            id="area-name"
            label="Area you cover with no travel fee"
            hint="For example: Al Khalidiyah."
            value={booking.areaName}
            onChange={(areaName) => setBooking({ areaName })}
          />
        </div>

        <Field
          label="Travel fee outside that area, in dirhams"
          htmlFor="travel-fee"
        >
          <TextInput
            id="travel-fee"
            value={String(booking.travelFee)}
            onChange={(fee) => setBooking({ travelFee: Number(fee.replace(/[^\d.]/g, '')) || 0 })}
            inputMode="decimal"
            dir="ltr"
          />
        </Field>
      </section>

      <section className="a-card mt-6 space-y-7">
        <h2 className="a-h2">Paying online</h2>
        <p className="text-[1.05rem] text-charcoal-soft">
          Customers can pay a small amount when they book, which makes them far less likely to
          miss the appointment. They pay the rest at the shop.
        </p>

        <Toggle
          label="Offer online payment"
          hint="Turn this off and every customer simply pays you at the appointment."
          checked={booking.depositEnabled}
          onChange={(depositEnabled) => setBooking({ depositEnabled })}
          onLabel="Offered"
          offLabel="Not offered"
        />

        {booking.depositEnabled ? (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Field label="How the deposit is worked out" htmlFor="deposit-type">
                <select
                  id="deposit-type"
                  className="a-input"
                  value={booking.depositType}
                  onChange={(e) =>
                    setBooking({ depositType: e.target.value === 'percent' ? 'percent' : 'fixed' })
                  }
                >
                  <option value="fixed">A fixed amount in dirhams</option>
                  <option value="percent">A percentage of the booking</option>
                </select>
              </Field>

              <Field
                label={
                  booking.depositType === 'percent'
                    ? 'Percentage of the total'
                    : 'Amount in dirhams'
                }
                htmlFor="deposit-value"
              >
                <TextInput
                  id="deposit-value"
                  value={String(booking.depositValue)}
                  onChange={(value) =>
                    setBooking({ depositValue: Number(value.replace(/[^\d.]/g, '')) || 0 })
                  }
                  inputMode="decimal"
                  dir="ltr"
                />
              </Field>
            </div>

            <Toggle
              label="Make paying compulsory"
              hint="Leave this off so customers can choose to pay at the shop instead. Turning it on means nobody can book without paying first."
              checked={booking.depositRequired}
              onChange={(depositRequired) => setBooking({ depositRequired })}
              onLabel="Compulsory"
              offLabel="Their choice"
            />
          </>
        ) : null}
      </section>

      <section className="a-card mt-6 space-y-7">
        <h2 className="a-h2">Wording on the booking form</h2>
        <BilingualField
          id="booking-heading"
          label="Heading"
          value={booking.heading}
          onChange={(heading) => setBooking({ heading })}
        />
        <BilingualField
          id="booking-subheading"
          label="Sentence under the heading"
          value={booking.subheading}
          onChange={(subheading) => setBooking({ subheading })}
          multiline
        />
      </section>
    </div>
  );
}
