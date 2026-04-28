# Stripe Local Debug Guide

This project already supports Stripe Checkout plus webhook-based subscription
sync. Local debugging only works reliably when the Stripe product, price,
environment variables, local app, database, and Stripe CLI are all aligned.

## Readiness Checklist

Before starting local debugging, make sure all of the following are true:

- You are using Stripe **test mode**.
- `STRIPE_SECRET_KEY` is a real test secret key, not a placeholder value.
- `STRIPE_PRODUCT_ID` points to the same Stripe product used by
  `STRIPE_PRICE_ID`.
- `STRIPE_PRO_PRODUCT_ID` points to the same Stripe product used by
  `STRIPE_PRO_PRICE_ID`.
- `STRIPE_PRICE_ID` is a **recurring** price. One-time prices will be rejected
  by the app.
- `STRIPE_PRO_PRICE_ID` is also a **recurring** price.
- The app is running locally at `http://localhost:3000` unless you intentionally
  changed the port.
- Prisma migrations have been applied to the local SQLite database.
- Stripe CLI is installed and logged in.
- `stripe listen` is forwarding webhook events to
  `/api/stripe/webhook`.
- `STRIPE_WEBHOOK_SECRET` matches the current `whsec_...` value printed by
  Stripe CLI.

If any of the above is missing, the dashboard will usually fall back to one of
these states:

- `billing=config`: local Stripe env is incomplete
- `billing=price_recurring`: the configured price is not recurring
- `billing=price_product`: the configured price belongs to a different product
- `billing=stripe_api`: Stripe rejected the API request or the resource is not
  accessible by the current key

## 1. Local Environment Variables

Copy the example file first:

```bash
cp .env.example .env
```

Use values like this:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-random-secret"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRODUCT_ID="prod_..."
STRIPE_PRICE_ID="price_..."
STRIPE_PRO_PRODUCT_ID="prod_..."
STRIPE_PRO_PRICE_ID="price_..."
```

Notes:

- `AUTH_URL` and `NEXT_PUBLIC_APP_URL` should match your local app origin.
- `STRIPE_SECRET_KEY`, `STRIPE_PRODUCT_ID`, `STRIPE_PRICE_ID`,
  `STRIPE_PRO_PRODUCT_ID`, and `STRIPE_PRO_PRICE_ID` are required for checkout
  to become available.
- Placeholder fragments such as `replace_me`, `replace-with`, or `change-me`
  are treated as missing config by the app.
- `STRIPE_WEBHOOK_SECRET` is required for webhook signature verification.

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## 2. Stripe Dashboard Setup

Create or confirm the following resources in Stripe test mode:

1. Products that represent the Basic and Pro subscriptions sold by this app.
2. A recurring price under each product.
3. A test API key pair.

Important constraints enforced by the code:

- `STRIPE_PRICE_ID` must belong to `STRIPE_PRODUCT_ID`.
- `STRIPE_PRO_PRICE_ID` must belong to `STRIPE_PRO_PRODUCT_ID`.
- The price must include `recurring`; one-time prices do not work with this
  checkout flow.
- The checkout session is created in `subscription` mode, so only subscription
  prices are valid.

## 3. Local App Setup

Install dependencies:

```bash
pnpm install
```

Apply the local database schema and generate the client:

```bash
pnpm db:migrate --name stripe_local_debug
pnpm db:generate
```

Start the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Start Webhook Forwarding

Run Stripe CLI in a separate terminal:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Stripe CLI prints a webhook signing secret like `whsec_...`. Copy that value
into `.env` as `STRIPE_WEBHOOK_SECRET`.

Recommended sequence:

1. Start `pnpm dev`.
2. Start `stripe listen`.
3. Update `.env` with the newly printed `whsec_...`.
4. Restart the dev server if needed so the new env value is loaded.

Why this matters:

- The webhook route verifies the raw request body using
  `STRIPE_WEBHOOK_SECRET`.
- If the secret is stale, the route returns `400 Invalid signature`.
- Checkout can still redirect successfully even when webhook sync fails, which
  makes this easy to miss unless you watch the local logs.

## 5. Recommended Local Debug Flow

Use this flow when validating the full subscription lifecycle:

1. Register a local user at `/register`.
2. Visit `/dashboard` and confirm the paywall state is shown.
3. Start Stripe checkout from the dashboard.
4. Complete payment with a Stripe test card.
5. Confirm the browser returns to `/dashboard?checkout=success`.
6. Confirm Stripe CLI forwards `checkout.session.completed` and
   `customer.subscription.*` events.
7. Refresh `/dashboard` and confirm access becomes active.

The webhook route currently handles these events:

- `checkout.session.completed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 6. Common Test Cards

For browser-based local checkout testing, Stripe officially recommends using
test card numbers together with:

- any valid future expiry date, for example `12/34`
- any 3-digit CVC for Visa and Mastercard
- any value for ZIP or other optional form fields

Recommended cards for this project:

- Success: `4242 4242 4242 4242`
- Generic decline: `4000 0000 0000 0002`
- 3D Secure required and succeeds: `4000 0000 0000 3220`
- Authentication required on recurring/off-session behavior: `4000 0025 0000 3155`
- Always requires authentication: `4000 0027 6000 3184`

How to use them:

- Use `4242 4242 4242 4242` to verify the standard subscription checkout happy
  path.
- Use `4000 0000 0000 0002` to verify the app surfaces a failed payment path.
- Use `4000 0000 0000 3220` when you want to confirm 3D Secure challenge flow
  can complete successfully.
- Use `4000 0025 0000 3155` or `4000 0027 6000 3184` when you need to inspect
  authentication-sensitive flows more closely.

Important notes:

- Do not use real card details in local or test mode.
- These numbers work only with Stripe test keys and test mode resources.
- For server-side automated tests, Stripe recommends `PaymentMethod` fixtures
  such as `pm_card_visa` instead of raw card numbers, but for this local
  browser checkout flow the card numbers above are the most practical choice.

## 7. How To Test Failures and Cancellation

For realistic subscription debugging, prefer real checkout flows plus Stripe
Dashboard actions over generic `stripe trigger` fixtures.

Recommended approaches:

- Cancel the subscription in Stripe and verify the app receives
  `customer.subscription.deleted` or `customer.subscription.updated`.
- Trigger a payment failure scenario from Stripe test tools and verify the app
  processes `invoice.payment_failed`.
- Confirm the dashboard eventually revokes access when the synced subscription
  state no longer qualifies for access.

Why not rely only on `stripe trigger`:

- Fixture events are often detached from the actual local checkout session and
  local subscription metadata used by this app.
- Manual checkout produces the most trustworthy end-to-end signal for this
  codebase.

## 8. Quick Troubleshooting

### Dashboard shows config error

Symptoms:

- `/dashboard` reports Stripe billing is not configured.

Check:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRODUCT_ID`
- `STRIPE_PRICE_ID`
- `STRIPE_PRO_PRODUCT_ID`
- `STRIPE_PRO_PRICE_ID`
- whether any of them still contains placeholder text

### Checkout redirects back with Stripe API error

Symptoms:

- `/dashboard?billing=stripe_api`

Check:

- the secret key belongs to the same Stripe account as the products and prices
- the price exists in test mode
- the configured price is accessible by the current API key

### Checkout exists but subscription never activates

Symptoms:

- payment succeeds, but dashboard access does not refresh

Check:

- `stripe listen` is still running
- `STRIPE_WEBHOOK_SECRET` matches the current CLI session
- local terminal logs for `400 Invalid signature`
- forwarded endpoint path is exactly `/api/stripe/webhook`

### Dashboard says the price is invalid

Symptoms:

- `/dashboard?billing=price_recurring`
- `/dashboard?billing=price_product`

Check:

- the configured price is recurring
- the configured price belongs to `STRIPE_PRODUCT_ID`
- the configured Pro price belongs to `STRIPE_PRO_PRODUCT_ID`

## 9. Minimum Success Criteria

Local Stripe debugging can be considered ready only when all of the following
pass:

1. A user can start checkout from `/dashboard`.
2. Stripe redirects back to the app successfully.
3. Stripe CLI forwards webhook events to the local webhook endpoint.
4. The webhook signature is accepted.
5. The local subscription record is updated after webhook processing.
6. Dashboard access reflects the synced subscription state.
