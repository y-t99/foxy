# Subscription Upgrade Difference Checkout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Change paid plan upgrades so users pay a business-calculated difference checkout before the app performs a no-proration Stripe subscription update.

**Architecture:** Upgrade creation will create a Stripe Checkout Session in `payment` mode for the fixed difference between the current subscription item price and target price. Webhooks will complete the upgrade only after that payment session succeeds; the later Stripe subscription update will use `proration_behavior: "none"` so Stripe does not create another difference invoice. Local product access changes only after the no-proration subscription update succeeds.

**Tech Stack:** Next.js App Router route handlers and server actions, Stripe Checkout and Subscriptions API, Prisma, Vitest.

---

### Task 1: Upgrade Parameter And Difference Helpers

**Files:**
- Modify: `src/lib/subscription-upgrade.test.ts`
- Modify: `src/lib/subscription-upgrade.ts`

**Step 1: Write failing tests**

Add tests that expect subscription update params to use `payment_behavior: "error_if_incomplete"` and `proration_behavior: "none"`. Add difference amount tests for positive same-currency Stripe prices and invalid zero/cross-currency prices.

**Step 2: Verify red**

Run: `pnpm test src/lib/subscription-upgrade.test.ts`

Expected: tests fail because current code still uses pending payment behavior and always invoices proration, and no difference helper exists.

**Step 3: Implement minimal helper changes**

Update `buildSubscriptionUpgradeUpdateParams` and add a helper that calculates `target.unit_amount - current.unit_amount`, returning null for unsupported currency or missing amounts.

**Step 4: Verify green**

Run: `pnpm test src/lib/subscription-upgrade.test.ts`

Expected: the focused test file passes.

### Task 2: Create Difference Checkout Instead Of Updating Subscription Immediately

**Files:**
- Modify: `src/lib/subscription-upgrade.ts`

**Step 1: Write failing tests where possible**

Extend unit coverage around returned checkout semantics and log result shape if the existing module boundaries permit it without over-mocking Prisma and Stripe.

**Step 2: Implement checkout creation**

In `createSubscriptionUpgradeSession`, fetch the current Stripe subscription item price and target price, calculate the difference, create a pending `SubscriptionLog`, then create a Stripe Checkout Session with:

- `mode: "payment"`
- one `price_data` line item for the difference amount
- metadata linking `action=upgrade`, `subscriptionChangeUuid`, `localSubscriptionId`, old product, and target product
- dashboard success/cancel URLs

Return the Checkout URL and log UUID. Do not call `stripe.subscriptions.update` during upgrade initiation.

### Task 3: Complete Upgrade After Difference Payment

**Files:**
- Modify: `src/lib/stripe-sync.ts`
- Modify: `src/app/api/stripe/webhook/route.ts`

**Step 1: Add tests if practical**

Cover the pure metadata/log resolution behavior where possible.

**Step 2: Update webhook flow**

On `checkout.session.completed` with `metadata.action === "upgrade"`, retrieve the Stripe subscription, call `stripe.subscriptions.update` with no-proration params, then update local subscription access and mark the log `completed`. If the no-proration update fails, leave local access unchanged and mark the log `upgrade_failed`.

On `checkout.session.expired` with upgrade metadata, mark the pending log `expired` and leave access unchanged.

### Task 4: Notices And Verification

**Files:**
- Modify: `src/app/dashboard/notice.ts`
- Modify: `src/app/dashboard/notice.test.ts`
- Modify if needed: `src/app/actions/billing.ts`
- Modify if needed: `src/app/subscriptions/current/upgrade/route.ts`

**Step 1: Update user notices**

Change pending copy from “waiting for Stripe subscription payment” to “difference payment started; current plan remains until payment and upgrade complete.” Add `upgrade_failed` messaging.

**Step 2: Verify**

Run:

```bash
pnpm test src/lib/subscription-upgrade.test.ts src/app/dashboard/notice.test.ts
pnpm lint
pnpm build
```

Expected: all commands pass or any environment-specific blocker is documented with exact output.
