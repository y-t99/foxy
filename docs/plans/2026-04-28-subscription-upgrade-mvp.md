# Subscription Upgrade MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build active-subscription plan upgrades with webhook-confirmed permission switching.

**Architecture:** Add product levels and subscription logs to Prisma, centralize upgrade validation/session creation in a server-only library, expose both dashboard server action and route handler entry points, and extend Stripe webhook sync for pending upgrade completion/failure. Local access changes only after paid upgrade invoices.

**Tech Stack:** Next.js 16 App Router, React Server Actions, Route Handlers, Prisma 6, Stripe SDK 22, Vitest.

---

### Task 1: Product Levels And Eligibility Tests

**Files:**
- Modify: `src/lib/products.test.ts`
- Create: `src/lib/subscription-upgrade.test.ts`
- Create: `src/lib/subscription-upgrade.ts`

**Steps:**
1. Write failing tests that expect Basic level `1`, Pro level `2`, upward upgrade eligibility, and rejections for missing/inactive/expired/same-level targets.
2. Run `pnpm test src/lib/products.test.ts src/lib/subscription-upgrade.test.ts` and confirm failure.
3. Add product levels and the `getSubscriptionUpgradeIssue` helper.
4. Re-run the targeted tests and confirm pass.

### Task 2: Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_subscription_upgrade_mvp/migration.sql`

**Steps:**
1. Add `Product.level`.
2. Add `SubscriptionLog` with indexes for subscription/user and pending upgrade lookup.
3. Run `pnpm prisma validate` and `pnpm db:generate`.

### Task 3: Upgrade Session Service

**Files:**
- Modify: `src/lib/subscription-upgrade.ts`
- Modify: `src/app/actions/billing.ts`

**Steps:**
1. Implement a shared `createSubscriptionUpgradeSession` that authenticating callers can invoke with a user UUID and target product key/UUID.
2. Validate current subscription, target level, Stripe price, and platform subscription/customer IDs.
3. Create a pending upgrade log and call `stripe.subscriptions.update` with pending payment behavior.
4. Add `createUpgradeSession` server action that redirects to the hosted invoice URL when Stripe returns one, or back to the pending dashboard otherwise.

### Task 4: API Routes

**Files:**
- Create: `src/app/subscriptions/current/route.ts`
- Create: `src/app/subscriptions/current/upgrade/route.ts`

**Steps:**
1. Add authenticated `GET /subscriptions/current`.
2. Add authenticated `POST /subscriptions/current/upgrade`.
3. Return `checkout_url` and `subscription_change_uuid` for upgrade starts; return status errors for invalid upgrade requests.

### Task 5: Webhook Upgrade Handling

**Files:**
- Modify: `src/lib/stripe-sync.ts`
- Modify: `src/app/api/stripe/webhook/route.ts`

**Steps:**
1. Complete pending upgrade logs on paid subscription-update invoices and switch `subscription.productUuid`.
2. Mark pending upgrade logs failed on upgrade invoice failure without changing product access.
3. Mark pending upgrade logs failed when the Stripe subscription is deleted.
4. Keep first-subscribe behavior intact.

### Task 6: Dashboard UI

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/notice.ts`
- Modify: `src/app/dashboard/notice.test.ts`

**Steps:**
1. Show upgrade actions for active lower-level subscriptions, including cancel-at-period-end subscriptions.
2. Add concise notices for pending/failed unavailable upgrade states.
3. Re-run affected tests.

### Task 7: Final Verification

**Commands:**
- `pnpm prisma validate`
- `pnpm db:generate`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
