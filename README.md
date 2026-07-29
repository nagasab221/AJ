# AJ JD Gents Salon

Bilingual (English / Arabic) booking site for AJ JD Gents Salon, a barbershop in
Khalidiyah Park, Abu Dhabi. Several barbers on the floor, AJ is the owner, and the
shop also does home visits across the city.

Next.js 14 on Cloudflare Workers, Supabase for data, Stripe for deposits, Telegram
for owner alerts.

- **Deployment instructions:** [DEPLOY.md](DEPLOY.md)
- **Database schema:** [supabase/schema.sql](supabase/schema.sql)
- **Live:** https://aj.madebymanara.workers.dev

---

## Running it locally

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Then open <http://localhost:3000/en>.

Without Supabase configured the site serves the built-in demo content from
`src/lib/fallback-content.json`, so the whole front end runs with no accounts at
all. Bookings cannot be saved in that state; set `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` for that.

> Note: `.env.local` currently points at the **production** Supabase project, so a
> booking made locally lands in the real admin inbox. A second free Supabase
> project is the clean fix if that becomes annoying.

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run typecheck` | TypeScript, no emit |
| `npm run build` | Next production build |
| `npm run preview` | Build for Workers and run it locally in workerd |
| `npm run deploy` | Build for Workers and deploy |

---

## Design

**"Desert Linen & Palm", dark by default** with a light theme behind a toggle in
the header. The choice is stored in `localStorage` and applied by a blocking
script before first paint, so there is no flash of the wrong theme.

Every colour is a CSS variable holding `"R G B"` channels, mapped to semantic
Tailwind names in `tailwind.config.ts`. Themes swap by changing variables on
`<html data-theme>`, not by scattering `dark:` variants through the markup, and
the channel format is what keeps opacity utilities such as `text-charcoal/60`
working.

| Token | Dark | Light |
| --- | --- | --- |
| `linen` (page) | `#121410` | `#F7F3EB` |
| `paper` (cards) | `#1B1E18` | `#FFFCF6` |
| `charcoal` (text) | `#F0EDE3` | `#1C1F1C` |
| `palm` (accent) | `#8FC3A6` | `#2E4A3B` |
| `terracotta` | `#CE7B48` | `#B26032` |

`contrast` (footer) and `feature` (reviews band, ticker) are surfaces that stay
dark in **both** themes, so the footer does not turn white in light mode. The
announcement bar has its own fixed palette for the same reason.

Type is **Playfair Display** for headings, **Karla** for body, **IBM Plex Sans
Arabic** for Arabic. The recurring motif is a **keyhole arch** (`.arch` /
`.arch-sm`), framing the hero portrait, gallery, monogram and icon tiles.

Section order runs hero, ticker, about, gallery, services, booking, reviews,
location, contact, with numbered headings. All layout uses CSS logical properties
(`ms-`, `pe-`, `start-`, `end-`), so the Arabic RTL layout mirrors automatically.

### Motion

Hero content enters in sequence, sections fade up on first scroll into view, the
stat figures count up, service and review cards lift on hover, nav links grow an
underline, and buttons dip on press. The services ticker scrolls continuously and
reverses direction under RTL.

> The ticker keyframes live in `globals.css`, not `tailwind.config.ts`. Tailwind
> only emits a `@keyframes` block when its matching `animate-*` class appears in
> the markup, and the track is driven by raw CSS, so a config-only definition
> silently produced a bar that rendered but never moved.

Everything above is disabled under `prefers-reduced-motion`.

---

## How it fits together

```
src/
  app/
    (site)/[locale]/     public site, force-dynamic, reads Supabase per request
    (admin)/admin/       owner area, own root layout, pinned to the light theme
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
RLS enabled with no policies, so the tables are reachable only with the
service-role key, which is used server-side only. Admin auth is a single password
(`ADMIN_PASSWORD`) exchanged for an HMAC-signed, HttpOnly session cookie.

**Prices are never trusted from the browser.** `/api/reserve` resolves service ids
against the catalogue, recomputes the subtotal, revalidates the promo code and
recalculates the deposit before writing anything. The running total in the form is
only a preview.

---

## The three systems worth knowing about

### Promo codes

Created in the admin either by typing a code or generating a random 8-character
one. Each has a type (percent or fixed), a value, and optional expiry, usage limit
and minimum spend.

The discount applies to **services only, never the travel fee**, so a 100% code
cannot turn a cross-city home visit into a free trip.

Usage is claimed by the `redeem_promo` Postgres function, which increments the
counter and writes the redemption row in a single statement, so two customers
checking out at the same instant cannot both take the last use. If the claim fails
after the booking is written, the discount is stripped rather than honoured. When a
code drops to three or fewer remaining uses, the Telegram alert says so.

### Announcement banner

One row in `banner_settings`. When it is off the server renders nothing at all, so
there is no element and no empty space.

Dismissal is per browser session. A blocking script sets `data-banner="off"` on
`<html>` before the bar is parsed and CSS hides it, so a dismissed banner never
flashes into view. Saving with **"Show it again to people who closed it"** bumps
`version`, which changes the storage key and brings the bar back for everyone.

### Payments

Stripe **Payment Element** with `automatic_payment_methods`, which is what makes
Apple Pay and Google Pay appear as one-tap options on devices that support them,
with a card form as the fallback. The element is themed to match whichever theme
the visitor is using.

The booking is saved **before** payment, so abandoning the payment step costs the
customer nothing; the booking simply stays "pay at the shop". Currently configured
as an **optional deposit** (AED 25 flat by default, editable in the admin, and
switchable to a percentage or to compulsory).

A booking is only marked paid by the **webhook**, never by the browser reporting
success.

Stripe runs on Workers via `Stripe.createFetchHttpClient()`, and webhook signatures
are verified with `constructEventAsync` plus `createSubtleCryptoProvider()`,
because the synchronous versions throw on that runtime.

---

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/reserve` | Create a booking (validates everything server-side) |
| `GET /api/slots?date=` | Times already taken, for greying out the picker |
| `POST /api/manage-booking` | Look up, reschedule or cancel with reference + phone |
| `POST /api/promo/validate` | Live promo check (preview only) |
| `POST /api/payments/intent` | Create the deposit PaymentIntent |
| `POST /api/payments/webhook` | Stripe to us, the only writer of "paid" |
| `POST /api/contact` | Contact form to Telegram |
| `/api/admin/*` | login, logout, content, reservations, promos, banner, upload |

Both public forms carry a honeypot field; submissions that fill it get a plausible
success response and are silently discarded.

---

## Admin panel

Built for a user who is not comfortable with software:

- Pinned to the light theme, 18px base type, 52px inputs, 56px navigation rows
- Near-black text on linen, no grey-on-white anywhere
- Every nav item has a written label, never an icon alone
- Plain language: "New bookings", not "Pending records"
- Cards instead of dense tables for bookings and promo codes
- Confirmation dialogs that name the thing being deleted, with the safe option
  focused by default

Bookings, discount codes and the banner save immediately. The five content pages
(services, photos, reviews, website text, opening hours) share one **Save changes**
bar at the bottom.

**The admin interface is English-only**, while every piece of content it edits has
both English and Arabic fields side by side. If AJ would rather work in Arabic,
that is a straightforward follow-up.

---

## Content status

Real, taken from the Google listing and the owner:

- Name, address and map pin: Khalidiyah Park, Al Khalidiyah W9, Abu Dhabi
- Phone and WhatsApp: `+971529334415`
- Email: `red.label.salon@gmail.com`
- Rating 4.9 and 84 reviews, and four real Google reviews
- Open every day, 10:00 until midnight

Still placeholder, and editable in `/admin`:

- **All prices and durations.** These were invented and almost certainly wrong.
- The six gallery images (`public/img/work-*.svg` are generated placeholders)
- The AED 30 travel fee and the covered area (Al Khalidiyah)
- The AED 25 deposit

Google only exposes one day of opening hours to signed-out visitors, so all seven
days were set to the same 10:00 to midnight. Adjust any day that differs under
**Opening hours**.

Closing time is stored as `23:59` rather than `24:00`, because `24:00` is not a
valid `<input type="time">` value. It is displayed as `00:00`.
