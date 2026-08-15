# KaliPOS

A restaurant point-of-sale app for the Kenyan market, with M-Pesa STK Push
payments built in. This app was built from the 12 Stitch design screens you
uploaded (landing page, owner/staff login, dashboard, menu management, POS
checkout, the full M-Pesa payment flow, transactions ledger, and inventory
detail).

This README explains everything you need to do to get it running — written
for someone who's still learning, so it spells out each step.

## What's inside

```
kalipos-app/
  src/
    pages/          <- one file per screen (Dashboard.jsx, POSCheckout.jsx, etc.)
    components/      <- shared pieces (the sidebar+header shell, route guard)
    context/          <- app-wide state: who's logged in, what's in the cart
    lib/               <- helper functions (Supabase connection, M-Pesa calls, formatting)
  supabase/
    schema.sql        <- the database structure (tables) - run this once in Supabase
    functions/         <- server-side code that talks to Safaricom's M-Pesa API
```

## How the pieces fit together

- **React + Vite** — this is what renders the screens in the browser. Vite is
  just the tool that bundles everything up and runs a local dev server.
- **Tailwind CSS** — utility classes for styling (`bg-primary`, `rounded-xl`,
  etc.) matching the exact colors and fonts from your Stitch design.
- **Supabase** — your database (Postgres) plus authentication plus
  "Edge Functions" (small bits of server-side code). Owners log in with
  email/password through Supabase Auth; staff log in with phone + PIN through
  a custom Edge Function, since they don't have emails.
- **Safaricom Daraja API** — the actual M-Pesa payment system. Our Edge
  Functions talk to it directly so your M-Pesa secrets never touch the browser.

## Step 1 — Install and run locally

You'll need [Node.js](https://nodejs.org) installed (version 18+).

```bash
cd kalipos-app
npm install
cp .env.example .env
```

Open `.env` and fill in your Supabase project's URL and anon key (Step 2
tells you where to find them). Then:

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`) in your browser.

## Step 2 — Set up Supabase

1. Go to your project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. **Settings → API**: copy the "Project URL" and the "anon public" key into
   your `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **SQL Editor → New query**: paste in the entire contents of
   `supabase/schema.sql` and click Run. This creates all the tables (staff,
   menu items, orders, M-Pesa transactions, inventory) and adds a few sample
   menu items and inventory items so the app isn't empty on first load.

## Step 3 — Deploy the Edge Functions

The Edge Functions live in `supabase/functions/`. You'll need the
[Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF   # find this in your project URL
supabase functions deploy mpesa-stk-push
supabase functions deploy mpesa-callback
supabase functions deploy staff-login
supabase functions deploy staff-create
```

## Step 4 — Set up M-Pesa (Daraja) sandbox credentials

1. Create a free account at [developer.safaricom.co.ke](https://developer.safaricom.co.ke).
2. Create a new "App" — this gives you a **Consumer Key** and **Consumer
   Secret**.
3. Note your function's callback URL. It'll look like:
   `https://YOUR_PROJECT_REF.functions.supabase.co/mpesa-callback`
4. Set these as secrets on your Supabase project (Dashboard → Edge Functions
   → Manage secrets, or via CLI):

```bash
supabase secrets set MPESA_CONSUMER_KEY=your_consumer_key
supabase secrets set MPESA_CONSUMER_SECRET=your_consumer_secret
supabase secrets set MPESA_SHORTCODE=174379
supabase secrets set MPESA_CALLBACK_URL=https://YOUR_PROJECT_REF.functions.supabase.co/mpesa-callback
supabase secrets set MPESA_ENV=sandbox
```

`174379` is Safaricom's shared sandbox test shortcode — every developer's
sandbox app can use it, along with the public sandbox passkey already baked
into the `mpesa-stk-push` function as a fallback. This is enough to fully
test the payment flow with Safaricom's test phone numbers before you ever
touch real money.

When you're ready to accept real payments, apply for a production Paybill/Till
number from Safaricom, then update `MPESA_SHORTCODE`, add `MPESA_PASSKEY`
(your production passkey), and set `MPESA_ENV=production`.

## Step 5 — Add your first staff member

Owners sign up straight from the app (Landing page → "Create an account").
To add a waiter/cashier who logs in with phone + PIN, call the `staff-create`
function once (e.g. from your browser's dev console, or a quick script):

```js
await fetch("https://YOUR_PROJECT_REF.functions.supabase.co/staff-create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: "James Kinyua",
    phone: "0712345678",
    pin: "1234",
    role: "cashier",
  }),
});
```

(Later on, you'll probably want to build a small "Add Staff" screen inside
the app instead of doing this by hand — happy to build that next.)

## How the M-Pesa payment flow works, end to end

1. Cashier builds an order on the **POS Checkout** screen and taps "Pay with
   M-Pesa". This saves the order to the `orders` table.
2. The **M-Pesa Payment Initiation** screen asks for the customer's phone
   number, then calls the `mpesa-stk-push` Edge Function.
3. That function asks Safaricom to send a payment prompt to the customer's
   phone, and saves a "pending" row in `mpesa_transactions`.
4. The **Waiting for Payment** screen polls that row every 3 seconds.
5. Once the customer enters their PIN, Safaricom calls our
   `mpesa-callback` function directly (you never see this happen — it's
   server to server), which updates the transaction to "success" and marks
   the order "paid".
6. The waiting screen notices the status changed and moves to **Payment
   Successful**.

## What's simplified for now (things you might want to build next)

- **Single restaurant per deployment.** If you want KaliPOS to serve many
  restaurants from one database, every table would need a `restaurant_id`
  column, and Row Level Security policies to keep restaurants' data apart.
- **Row Level Security is currently OFF**, same as your SchoolOS setup during
  development. Before going live, you'll want to turn it on and write
  policies so, for example, staff can only see their own restaurant's data.
- **No "Orders" or "Settings" pages yet** — they're in the sidebar nav but
  not built out, since they weren't part of the 12 screens you shared.
- **Owner sign-up doesn't create a `staff` row automatically** — right now
  it just creates a Supabase Auth user. You may want a database trigger that
  adds a matching "owner" row to the `staff` table automatically.
