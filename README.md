# AJ — Barbershop website

Bilingual (English / Arabic) booking site for AJ, a Dubai barber working from a shop
and doing home visits. Next.js 14 on Cloudflare Workers, Supabase for data, Stripe
for deposits, Telegram for owner alerts.

- **Deployment instructions:** [DEPLOY.md](DEPLOY.md)
- **Database schema:** [supabase/schema.sql](supabase/schema.sql)

---

## Running it locally

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Then open <http://localhost:3000/en>.

Without Supabase configured the site serves the built-in demo content from
`src/lib/fallback-content.json`, so you can develop the whole front end with no
accounts at all. Bookings cannot be saved in that state — set `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` for that.

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run typecheck` | TypeScript, no emit |
| `npm run build` | Next production build |
| `npm run preview` | Build for Workers and run it locally in workerd |
| `npm run deploy` | Build for Workers and deploy |

---

## Design

**"Desert Linen & Palm"** — deliberately unrelated to the MJ Barbershop site
(ink/cream/brass, dark, centred, Playfair + Inter).

| | |
| --- | --- |
| Page | Linen `#F7F3EB`, cards Paper `#FFFCF6`, borders Dune `#E7DCC9` |
| Primary | Palm `#2E4A3B` |
| Secondary | Terracotta `#C4703F` |
| Text | Charcoal `#1C1F1C`, muted Stone `#5C6459` |
| Display | Instrument Serif |
| Body | Karla |
| Arabic | IBM Plex Sans Arabic |

The recurring motif is a **keyhole arch** (`.arch` / `.arch-sm` in
`globals.css`) — it frames the hero portrait, the gallery, the AJ monogram and the
icon tiles. Section order runs hero → ticker → about → gallery → services →
booking → reviews → location → contact, with numbered section headings.

All layout uses CSS logical properties (`ms-`, `pe-`, `start-`, `end-`), so the
Arabic RTL layout mirrors automatically rather than needing its own rules.

---

## How it fits together

```
src/
  app/
    (site)/[locale]/     public site — force-dynamic, reads Supabase per request
    (admin)/admin/       owner area, its own root layout and larger type scale
    api/                 route handlers (below)
  components/
    booking/             the multi-step form, calendar, promo field, Stripe panel
    admin/               owner-area panels
  lib/
    db.ts                every Supabase read and write
    pricing.ts           all money maths, shared by browser and server
    promo.ts             promo validation rules
    booking.ts           slots, working hours, UAE phone normalisation
    stripe.ts            Stripe configured for the Workers runtime
```

**Security model.** The browser never holds a Supabase credential. Every table has
RLS enabled with no policies, so the tables are reachable only with the service-role
key, which is used server-side only. Admin auth is a single password
(`ADMIN_PASSWORD`) exchanged for an HMAC-signed, HttpOnly session cookie.

**Prices are never trusted from the browser.** `/api/reserve` resolves service ids
against the catalogue, recomputes the subtotal, revalidates the promo code and
recalculates the deposit before writing anything. The running total in the form is
only a preview.

---

## The three systems worth knowing about

### Promo codes

Created in the admin either by typing a code or generating a random 8-character one.
Each has a type (percent or fixed), a value, and optional expiry, usage limit and
minimum spend.

The discount applies to **services only, never the travel fee**, so a 100% code
cannot turn a cross-Dubai home visit into a free trip.

Usage is claimed by the `redeem_promo` Postgres function, which increments the
counter and writes the redemption row in a single statement — two customers checking
out at the same instant cannot both take the last use. If the claim fails after the
booking is written, the discount is stripped rather than honoured. When a code drops
to three or fewer remaining uses, the Telegram alert says so.

### Announcement banner

One row in `banner_settings`. When it is off the server renders nothing at all — no
element, no empty space.

Dismissal is per browser session. A small blocking script in the page sets
`data-banner="off"` on `<html>` before the bar is parsed, and CSS hides it, so a
dismissed banner never flashes into view. Saving with **"Show it again to people who
closed it"** bumps `version`, which changes the storage key and brings the bar back
for everyone.

### Payments

Stripe **Payment Element** with `automatic_payment_methods`, which is what makes
Apple Pay and Google Pay appear as one-tap options on devices that support them,
with a card form as the fallback.

The booking is saved **before** payment, so abandoning the payment step costs the
customer nothing — the booking simply stays "pay at the shop". Currently configured
as an **optional deposit** (AED 25 flat by default, editable in the admin, and
switchable to a percentage or to compulsory).

A booking is only marked paid by the **webhook**, never by the browser reporting
success.

Stripe runs on Workers via `Stripe.createFetchHttpClient()`, and webhook signatures
are verified with `constructEventAsync` + `createSubtleCryptoProvider()` — the
synchronous versions throw on that runtime.

---

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/reserve` | Create a booking (validates everything server-side) |
| `GET /api/slots?date=` | Times already taken, for greying out the picker |
| `POST /api/manage-booking` | Look up / reschedule / cancel with reference + phone |
| `POST /api/promo/validate` | Live promo check (preview only) |
| `POST /api/payments/intent` | Create the deposit PaymentIntent |
| `POST /api/payments/webhook` | Stripe → us; the only writer of "paid" |
| `POST /api/contact` | Contact form → Telegram |
| `/api/admin/*` | login, logout, content, reservations, promos, banner, upload |

Both public forms carry a honeypot field; submissions that fill it get a plausible
success response and are silently discarded.

---

## Admin panel

Built for a user who is not comfortable with software:

- 18px base type, 52px inputs, 56px navigation rows
- Near-black text on linen — no grey-on-white anywhere
- Every nav item has a written label, never an icon alone
- Plain language: "New bookings", not "Pending records"
- Cards instead of dense tables for bookings and promo codes
- Confirmation dialogs that name the thing being deleted, with the safe option
  focused by default

Bookings, discount codes and the banner save immediately. The five content pages
(services, photos, reviews, website text, opening hours) share one **Save changes**
bar at the bottom of the page.

**The admin interface is currently English-only**, while every piece of content it
edits has both English and Arabic fields side by side. If AJ would rather work in
Arabic, that is a straightforward follow-up.

---

## Placeholder content to replace

`src/lib/fallback-content.json` seeds the database on first run. These are
invented and need real values:

- Phone and WhatsApp: `+971500000000`
- Email: `hello@ajfades.ae`
- Address: Al Wasl Road, Jumeirah 1 — and the map `lat` / `lng`
- The four statistics (12 years, 8,000+ clients, 4.9, 40+ home visits)
- All prices and durations
- The six gallery images (`public/img/work-*.svg` are generated placeholders)
- The four reviews

Everything above is editable in `/admin` once Supabase is connected — the JSON file
is only the starting point.
