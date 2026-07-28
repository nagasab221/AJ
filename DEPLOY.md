# Deploying the AJ website

Two halves: **GitHub** (where the code lives) and **Cloudflare Workers** (where the
site runs). Supabase, Telegram and Stripe are separate accounts the Worker talks to.

Do the steps in order. Steps 1–4 only ever need doing once.

---

## 0. Before you start

You need:

- Node.js 20 or newer — check with `node -v`
- A GitHub account
- A Cloudflare account (free plan is fine)
- A Supabase account (free plan is fine)
- For payments: a Stripe account. **Stripe does operate in the UAE**, but a live
  account needs a UAE trade licence and a UAE bank account. Everything below works
  in test mode without any of that.

Install the dependencies once:

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required: `@opennextjs/cloudflare` declares a peer range of
Next 15, but this project runs Next 14 (as does the MJ site, deployed the same way).
The build passes `--dangerouslyUseUnsupportedNextVersion` for the same reason.

---

## 1. Supabase (database)

1. Go to <https://supabase.com> → **New project**. Pick a region close to the UAE
   (Frankfurt or Mumbai are the usual choices).
2. Wait for it to finish provisioning.
3. Open **SQL Editor** → **New query**.
4. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and press
   **Run**. It creates every table, the `redeem_promo` function and the `uploads`
   image bucket. It is safe to run again later.
5. Go to **Project Settings → API** and copy two values:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role** secret key → this is `SUPABASE_SERVICE_ROLE_KEY`

> The service-role key bypasses all row-level security. It is only ever used
> server-side. Never put it in a `NEXT_PUBLIC_*` variable and never commit it.

---

## 2. Telegram (booking alerts)

1. In Telegram, message **@BotFather** → `/newbot` → follow the prompts.
2. Copy the token it gives you → this is `TELEGRAM_BOT_TOKEN`.
3. **Send your new bot a `/start` message.** A bot cannot message you until you have
   messaged it first — this is the step people forget.
4. Open this URL in a browser, replacing `<TOKEN>`:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Find `"chat":{"id":123456789` → that number is `TELEGRAM_CHAT_ID`.

To send alerts to a group instead, add the bot to the group, send a message there,
and use the group's negative id from the same URL.

---

## 3. Stripe (deposits, Apple Pay & Google Pay)

1. Create an account at <https://stripe.com>. Stay in **Test mode** for now (the
   toggle is at the top right of the dashboard).
2. **Developers → API keys**:
   - **Publishable key** (`pk_test_…`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (`sk_test_…`) → `STRIPE_SECRET_KEY`
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-SITE/api/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`,
     `charge.refunded`
   - After creating it, copy the **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`
4. **Apple Pay only:** Settings → Payments → **Payment method domains** → add your
   live domain. Apple Pay will not appear until the domain is registered and
   verified. Google Pay needs nothing extra.

Test cards: `4242 4242 4242 4242`, any future expiry, any CVC.

Going live later: switch the dashboard out of test mode, regenerate all three
values from the live keys, and update them in Cloudflare.

**If Stripe is left unconfigured the site still works** — the "pay now" option
simply never appears and every booking is recorded as pay-at-the-shop.

---

## 4. Push the code to GitHub

From the project folder:

```bash
git init
git add -A
git commit -m "AJ barbershop website"
```

Create an empty repository on GitHub (no README, no .gitignore), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/aj-barbershop.git
git branch -M main
git push -u origin main
```

Or with the GitHub CLI, which creates the repo for you:

```bash
gh repo create aj-barbershop --private --source=. --remote=origin --push
```

`.env.local` is in `.gitignore`, so your keys are not pushed. Confirm with
`git status` that it is not listed.

---

## 5. Deploy to Cloudflare Workers

Two ways. **Option A** is what you want for a client site — every push to `main`
redeploys automatically.

### Option A — connect the GitHub repo (automatic deploys)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** →
   **Import a repository**.
2. Authorise GitHub and pick `aj-barbershop`.
3. Set the build settings:
   - **Build command:** `npm run cf:build`
   - **Deploy command:** `npx wrangler deploy`
   - **Install command:** `npm install --legacy-peer-deps`
4. Add the environment variables (step 6) **before** the first deploy, or it will
   build but fail at runtime.
5. Save and deploy.

From then on: `git push` → Cloudflare rebuilds and deploys on its own.

### Option B — deploy from your own machine

```bash
npx wrangler login
npm run deploy
```

`npm run deploy` runs the OpenNext build and then `wrangler deploy`. Use this for a
quick first deploy or when GitHub is not connected. Variables still have to be set
in the dashboard (step 6).

---

## 6. Environment variables in Cloudflare

Dashboard → **Workers & Pages** → `aj-barbershop` → **Settings** →
**Variables and Secrets**.

Add each of these. Use **Secret** (encrypted) for everything except the two marked
plain text:

| Name | Type | Value |
| --- | --- | --- |
| `SUPABASE_URL` | Secret | from step 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | from step 1 |
| `ADMIN_PASSWORD` | Secret | the password AJ will type at `/admin` |
| `ADMIN_SESSION_SECRET` | Secret | any long random string (see below) |
| `TELEGRAM_BOT_TOKEN` | Secret | from step 2 |
| `TELEGRAM_CHAT_ID` | Secret | from step 2 |
| `STRIPE_SECRET_KEY` | Secret | from step 3 |
| `STRIPE_WEBHOOK_SECRET` | Secret | from step 3 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Plain text | from step 3 |
| `NEXT_PUBLIC_SITE_URL` | Plain text | `https://your-final-domain` |

Generate a session secret:

```bash
node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"
```

> `NEXT_PUBLIC_*` values are baked in at **build** time, so after changing either of
> those you must redeploy, not just restart. The rest are read at runtime.

**Redeploy after adding variables.**

---

## 7. Custom domain

1. Add the domain to Cloudflare (**Websites → Add a site**) and point the
   registrar's nameservers at Cloudflare.
2. Worker → **Settings → Domains & Routes** → **Add** → **Custom domain** →
   e.g. `ajfades.ae`.
3. Update `NEXT_PUBLIC_SITE_URL` to the real domain and redeploy.
4. Update the Stripe webhook URL to the real domain.
5. Register the domain for Apple Pay (step 3.4).

---

## 8. After the first deploy — check these

- [ ] `https://your-site/en` and `/ar` both load, and the Arabic page reads
      right-to-left
- [ ] `/admin` — sign in with `ADMIN_PASSWORD`
- [ ] Make a test booking → it appears under **New bookings** and a Telegram
      message arrives
- [ ] Create a discount code in the admin, then use it on a booking → the total
      drops and the usage counter goes up
- [ ] Switch the top banner on → it appears; switch it off → it disappears with no
      gap left behind
- [ ] Pay a test deposit with card `4242 4242 4242 4242` → the booking shows
      **Deposit paid online**
- [ ] Stripe → Developers → Webhooks → your endpoint shows a successful delivery

---

## 9. Everyday updates

```bash
git add -A
git commit -m "what changed"
git push
```

With Option A that is the whole deployment. With Option B, run `npm run deploy`
afterwards.

Content changes (prices, photos, text, hours, codes, banner) are made by AJ in
`/admin` and appear immediately — **they do not need a deploy**.

---

## Troubleshooting

**`ERESOLVE unable to resolve dependency tree`**
Use `npm install --legacy-peer-deps`. See the note in step 0.

**Build fails on `esbuild` or `workerd`**
Their install scripts were skipped. Run `npm approve-scripts --allow-scripts-pending`,
approve them, then `npm install --legacy-peer-deps` again.

**Site loads but shows demo prices and no bookings save**
Supabase variables are missing or wrong in Cloudflare. The site deliberately falls
back to built-in demo content rather than showing an error page.

**`/admin` says the password is wrong when it isn't**
`ADMIN_SESSION_SECRET` is missing. Both it and `ADMIN_PASSWORD` must be set.

**No Telegram messages**
You never sent the bot `/start`, or the chat id is wrong. Re-check step 2.

**Apple Pay does not show up**
The domain is not registered in Stripe (step 3.4), or you are testing in a browser
that does not support it. Google Pay needs Chrome with a saved card; Apple Pay needs
Safari on Apple hardware. Card payment always shows as the fallback.

**Payment succeeds but the booking still says "not paid"**
The webhook is not reaching the site. Check the URL, the signing secret, and the
delivery log in the Stripe dashboard.
