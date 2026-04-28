# Subscription Upgrade MVP Design

## Goal

Support upgrading an active, unexpired paid subscription from a lower product to a higher product while keeping local access unchanged until Stripe confirms payment.

## Approach

Products get an integer `level`; higher levels are valid upgrade targets. Upgrade attempts create a pending `SubscriptionLog` tied to the existing local subscription. The local `Subscription.productUuid` remains the old product until an upgrade invoice is paid.

The user-facing dashboard uses a server action to start an upgrade. The API surface also exposes `GET /subscriptions/current` and `POST /subscriptions/current/upgrade` to match the MVP spec. Both upgrade entry points share the same validation and Stripe subscription update path.

## Stripe Flow

The MVP uses `stripe.subscriptions.update` with pending payment behavior and immediate proration invoicing. If Stripe returns a hosted invoice URL, the UI redirects there for payment; otherwise it returns to the dashboard and waits for webhook confirmation. Stripe remains the payment/subscription truth source, while the app database remains the permission truth source.

Webhook handling switches access only on a paid upgrade invoice. Failed upgrade invoices and expired upgrade checkout sessions leave the subscription on the old product and mark the pending log as failed or expired.

## Data

- `Product.level` stores plan rank.
- `SubscriptionLog` stores action/status/platform plus an upgrade-specific `result` JSON payload for product UUIDs, Stripe session/invoice IDs, timestamps, and failure reasons.

## Validation

An upgrade is allowed only when:

- the user has an existing subscription;
- `subscription.status` is `active`;
- `currentPeriodEnd` is in the future;
- the target product level is greater than the current product level.

`cancelAtPeriodEnd=true` remains upgradeable while the subscription is active and unexpired. A successful upgrade clears `cancelAtPeriodEnd`.

## Testing

Unit tests cover product levels and upgrade eligibility. Verification runs Prisma validation/generation, Vitest, lint, and build where the local environment permits.
