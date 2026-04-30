# Annual Products Month Credit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two annual Stripe subscription products and charge upgrade differences with month-based remaining value, including cross-interval upgrades.

**Architecture:** Extend the static product catalog with interval metadata and optional literal Stripe price IDs. Resolve missing platform product IDs from Stripe Price objects before writing `ProductPlatform`. Replace simple unit-amount difference calculation with month-based remaining-value calculation using the current Stripe subscription item's period.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 6, Stripe SDK 22, Vitest.

---

### Task 1: Product Catalog Tests

**Files:**
- Modify: `src/lib/products.test.ts`
- Modify: `src/lib/products.ts`

**Step 1: Write the failing test**

Add expectations that `SUBSCRIPTION_PRODUCTS` includes `basic_annual` and `pro_annual`, with annual price IDs and 12-month intervals.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/products.test.ts`

Expected: FAIL because the annual products are missing.

**Step 3: Write minimal implementation**

Extend `SubscriptionProductKey`, product config, and `SUBSCRIPTION_PRODUCTS` with the two annual products.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/products.test.ts`

Expected: PASS.

### Task 2: Stripe Product Resolution Tests

**Files:**
- Modify: `src/lib/products.test.ts`
- Modify: `src/lib/products.ts`

**Step 1: Write the failing test**

Add tests for a helper that returns the configured Stripe price ID and resolves a missing Stripe product ID from a retrieved Stripe Price.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/products.test.ts`

Expected: FAIL because the helper does not exist.

**Step 3: Write minimal implementation**

Add product helper functions and update `ensureSubscriptionProduct` to use them.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/products.test.ts`

Expected: PASS.

### Task 3: Month-Based Upgrade Difference Tests

**Files:**
- Modify: `src/lib/subscription-upgrade.test.ts`
- Modify: `src/lib/subscription-upgrade.ts`

**Step 1: Write the failing test**

Add tests for annual-to-annual after 5 complete months, monthly-to-annual cross-interval upgrades, and invalid interval data.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/subscription-upgrade.test.ts`

Expected: FAIL because calculation currently subtracts full unit amounts.

**Step 3: Write minimal implementation**

Update `calculateSubscriptionUpgradeDifference` to accept subscription period dates and Stripe recurring interval data, then calculate remaining months and rounded smallest-unit amount.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/subscription-upgrade.test.ts`

Expected: PASS.

### Task 4: Integration Wiring

**Files:**
- Modify: `src/app/actions/billing.ts`
- Modify: `src/lib/subscription-upgrade.ts`
- Modify: `src/lib/env.ts`
- Modify: `src/lib/env.test.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/stripe-local-debug.md`

**Step 1: Write failing tests where applicable**

Update env tests so checkout readiness is not tied to annual product ID variables.

**Step 2: Run tests to verify failure**

Run: `pnpm test src/lib/env.test.ts src/lib/products.test.ts src/lib/subscription-upgrade.test.ts`

Expected: FAIL before implementation updates.

**Step 3: Wire product helpers into checkout and upgrade**

Use product helpers for Stripe price IDs and product ID validation. Keep existing monthly env support.

**Step 4: Verify**

Run: `pnpm test src/lib/env.test.ts src/lib/products.test.ts src/lib/subscription-upgrade.test.ts`

Expected: PASS.

### Task 5: Full Verification

**Files:**
- All touched files

**Step 1: Run focused tests**

Run: `pnpm test src/lib/products.test.ts src/lib/subscription-upgrade.test.ts src/lib/env.test.ts`

Expected: PASS.

**Step 2: Run all tests**

Run: `pnpm test`

Expected: PASS.

**Step 3: Run lint**

Run: `pnpm lint`

Expected: PASS.
