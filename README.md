# Noobz Network — Payments + Newsletter

Payment-link dashboard and event ticketing for **Noobz Network**. Single admin login, branded `/pay` and `/event` pages, plus a locked-brand newsletter sent through Resend.

Public brand: **Noobz Network**. Repo: `cnoobz`. Footer credit stays KemisPay / Cash N' Go.

## Stack

- Next.js 15 (App Router) + Tailwind CSS
- Better Auth (email/password, single admin, no public sign-up)
- Supabase (Postgres + Storage bucket `cnoobz-assets`)
- Cash N' Go / PayLanes redirect checkout
- Resend (one subscriber list)

## Branding

| Token | Value |
|-------|-------|
| Headings | Pixelify Sans |
| Body | Inter |
| Blue | `#2F4BFF` |
| Pink | `#FF2EC8` |
| Background | `#F4F6FF` |

Logos: [`public/noob-wordmark.png`](public/noob-wordmark.png), [`public/noob-mark.png`](public/noob-mark.png), [`public/noob-icon.png`](public/noob-icon.png)

Currency: **BSD**. Business timezone: **America/Nassau**.

## Local development

1. **Prerequisites:** Docker Desktop running, Node 20+

2. **Install & start local Supabase**
   ```bash
   cd cnoobz
   npm install
   npm run db:start
   ```

3. **Env file** — copy `.env.example` to `.env.local` and point at local keys from `npm run db:status`:
   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
   - `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`
   - anon + service_role keys from status output
   - `BETTER_AUTH_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

4. **Seed admin (once)**
   ```bash
   npm run seed:admin
   ```
   Default admin email: `nstrachan361@gmail.com`

5. **Run the app**
   ```bash
   npm run dev
   ```
   - App: http://localhost:3000/login
   - Studio: http://127.0.0.1:54323

6. **Stop local DB when done**
   ```bash
   npm run db:stop
   ```

### Cloud Supabase

1. Create a Supabase project
2. Swap `.env` / Vercel env to cloud URL + keys + `DATABASE_URL`
3. Run `scripts/migration.sql` (or `supabase db push`) against cloud
4. Create public bucket `cnoobz-assets`
5. Re-seed admin if needed

## Cash N' Go

Open **Settings** and save Merchant ID + the Headers API key (`apikey`). Choose QA or Production. Payments settle by calling Cash N' Go `GET /merchant/web-payment/transaction-info` when the customer returns from PayLanes. Manual **Sync** and the daily cron backfill anyone who closes the tab.

## Newsletter (Resend)

One list. Public subscribe on `/pay/[linkId]` and `/event/[token]`. Admin composes at `/dashboard/newsletter` using a locked Noobz Network template (header, colors, footer). Slots: hero image, headline, body, extra images, CTA.

Set after the sending domain is verified:

- `RESEND_API_KEY`
- `RESEND_FROM` e.g. `Noobz Network <hello@your-domain>`

Send is disabled until both are present. Unsubscribe: `/unsubscribe/[token]`.

## RLS note

App tables have RLS enabled with **no anon policies**. Public pages are public at HTTP, but the Next.js server reads via `SUPABASE_SERVICE_ROLE_KEY`. Do not loosen RLS to “fix” the public pay page.

## Routes

| Path | Purpose |
|------|---------|
| `/login` | Admin sign-in |
| `/dashboard` | Summary cards + link generator |
| `/dashboard/links` | All payment links |
| `/dashboard/events` | Event ticket links |
| `/dashboard/newsletter` | Composer, subscribers, send |
| `/dashboard/transactions` | CNG-backed history (return confirm + sync) |
| `/dashboard/settings` | Business + Cash N' Go config |
| `/pay/[linkId]` | Customer payment page |
| `/event/[token]` | Event ticket page |
| `/unsubscribe/[token]` | One-click unsubscribe |
| `/api/cng/sync` | Admin-only manual CNG history sync |
| `/api/cron/cng-sync` | Daily Vercel cron sync (`CRON_SECRET`) |

## Cash N' Go flow

1. Admin generates a link → stored in `payment_links`
2. Customer opens `/pay/{token}` → **Pay Now** → `POST /api/cng-url`
3. Browser hits `GET /api/cng/redirect/{orderNumber}` → 302 to PayLanes with `API_KEY` + `AUTH_ID`
4. Customer returns to `/cng/return/success` with `ORDER_NUMBER` and `PAYMENT_ID`
5. The server calls CNG `GET /merchant/web-payment/transaction-info`, and only if `processed` is true and the amount matches does it mark the checkout paid and **upsert** a `transactions` row.

Sensitive settings (`cng_api_key`) are encrypted with AES-256-GCM (`lib/crypto.ts`) before storage.

## Transaction history

- `GET /merchant/web-payment/transaction-info`
- `GET /merchant/web-payment/transactions`

**Manual sync:** on `/dashboard/transactions`. **Daily cron:** `GET /api/cron/cng-sync` at 06:00 UTC (`vercel.json`).

Rows upsert by `cng_payment_id`, falling back to `order_number`. Payments with no matching checkout session are stored with `link_id` null and shown as **External / pre-CNOOBZ**.

### Revenue fields

| Column | Meaning |
|--------|---------|
| `amount_cents` | Gross — what the customer paid |
| `net_cents` | Net — merchant amount after PayLanes fees |
| `fee_cents` | PayLanes fee |

Dashboard **Today's Revenue** uses `net_cents` when present, otherwise gross.

## Deploy (Vercel)

Point a Vercel project at this repo, add env vars (including `CRON_SECRET`), and run the migration + seed against production Supabase. Attach the custom domain last. Do not commit secrets.
