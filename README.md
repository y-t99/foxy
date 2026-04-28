# foxy

Next.js App Router subscription MVP with local email/password auth, Stripe
Checkout subscriptions, webhook synchronization, and a protected dashboard.

## Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 6
- SQLite
- Auth.js / NextAuth Credentials Provider
- Stripe Billing
- pnpm

## Environment

Copy the example environment file and fill in local secrets:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-random-secret"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_replace_me"
STRIPE_SECRET_KEY="sk_test_replace_me"
STRIPE_WEBHOOK_SECRET="whsec_replace_me"
STRIPE_PRODUCT_ID="prod_T6BENacglOuI18"
STRIPE_PRICE_ID="price_1S9ysPRxCAAlii2EbS2iW9PG"
STRIPE_PRO_PRODUCT_ID="prod_UPfW7TdFgqmI7c"
STRIPE_PRO_PRICE_ID="price_1TQqAyRxCAAlii2EGGRZGBxT"
```

Keep real Stripe secrets only in `.env`. After local verification, rotate any
test secret or webhook secret that was shared outside Stripe.

The app offers Basic Plan at $10.00 and Pro Plan at $20.00 USD. For
`subscription` mode, each configured price ID must point to a recurring Stripe
price. A one-time price cannot be used to create subscription Checkout
Sessions.

Generate an auth secret with:

```bash
openssl rand -base64 32
```

## Development

Install dependencies:

```bash
pnpm install
```

Apply the local SQLite schema and generate the Prisma client:

```bash
pnpm db:migrate --name subscription_mvp
pnpm db:generate
```

Start the development server:

```bash
pnpm dev
```

Open http://localhost:3000.

## Prisma

The schema lives in `prisma/schema.prisma` and stores:

- users with hashed local passwords
- business products
- product platform mappings for Stripe product and price IDs
- subscriptions
- subscription platform mappings for Stripe customer and subscription IDs
- processed Stripe webhook events for idempotency

SQLite runs with `relationMode = "prisma"`, so Prisma keeps relation fields for
queries, but the database itself does not create foreign key constraints.

Useful commands:

```bash
pnpm prisma validate
pnpm db:generate
pnpm db:studio
```

When you add or change models later, create a new migration:

```bash
pnpm db:migrate --name your_change_name
```

## Stripe Webhooks

Detailed local setup and troubleshooting live in
[`docs/stripe-local-debug.md`](docs/stripe-local-debug.md).

For local webhook testing, run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then set `STRIPE_WEBHOOK_SECRET` in `.env` to the `whsec_...` value printed by
the Stripe CLI.

Handled events:

- `checkout.session.completed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Verification

Run the project checks:

```bash
pnpm prisma validate
pnpm db:generate
pnpm lint
pnpm test
pnpm build
```

Manual MVP flow:

1. Register a user at `/register`.
2. Visit `/dashboard` and confirm the paywall is shown.
3. Subscribe through Stripe Checkout.
4. Return to `/dashboard` and confirm paid content is unlocked.
5. Cancel the subscription and confirm access remains until the current period
   ends.
6. Trigger payment failure or subscription deletion through Stripe and confirm
   access is revoked.
