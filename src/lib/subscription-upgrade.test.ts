import { describe, expect, it } from "vitest";
import {
  buildSubscriptionUpgradeUpdateParams,
  calculateSubscriptionUpgradeDifference,
  getSubscriptionUpgradeIssue,
} from "./subscription-upgrade";

const future = new Date("2030-01-01T00:00:00.000Z");
const past = new Date("2020-01-01T00:00:00.000Z");
const now = new Date("2026-04-28T00:00:00.000Z");
const periodStart = new Date("2026-04-01T00:00:00.000Z");
const periodEnd = new Date("2026-05-01T00:00:00.000Z");

describe("getSubscriptionUpgradeIssue", () => {
  it("allows active unexpired subscriptions to upgrade to a higher level", () => {
    expect(
      getSubscriptionUpgradeIssue({
        currentPeriodEnd: future,
        currentProductLevel: 1,
        now,
        status: "active",
        targetProductLevel: 2,
      }),
    ).toBeNull();
  });

  it("allows same-level monthly subscriptions to upgrade to annual billing", () => {
    expect(
      getSubscriptionUpgradeIssue({
        currentIntervalMonths: 1,
        currentPeriodEnd: future,
        currentProductLevel: 1,
        now,
        status: "active",
        targetIntervalMonths: 12,
        targetProductLevel: 1,
      }),
    ).toBeNull();
  });

  it("allows scheduled cancellations while the current period is still active", () => {
    expect(
      getSubscriptionUpgradeIssue({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: future,
        currentProductLevel: 1,
        now,
        status: "active",
        targetProductLevel: 2,
      }),
    ).toBeNull();
  });

  it("rejects subscriptions that are not active and unexpired", () => {
    expect(
      getSubscriptionUpgradeIssue({
        currentPeriodEnd: future,
        currentProductLevel: 1,
        now,
        status: "canceled",
        targetProductLevel: 2,
      }),
    ).toBe("subscription_inactive");

    expect(
      getSubscriptionUpgradeIssue({
        currentPeriodEnd: past,
        currentProductLevel: 1,
        now,
        status: "active",
        targetProductLevel: 2,
      }),
    ).toBe("subscription_expired");
  });

  it("rejects targets that are not higher than the current product", () => {
    expect(
      getSubscriptionUpgradeIssue({
        currentPeriodEnd: future,
        currentProductLevel: 2,
        now,
        status: "active",
        targetProductLevel: 2,
      }),
    ).toBe("target_not_higher");

    expect(
      getSubscriptionUpgradeIssue({
        currentIntervalMonths: 12,
        currentPeriodEnd: future,
        currentProductLevel: 1,
        now,
        status: "active",
        targetIntervalMonths: 1,
        targetProductLevel: 1,
      }),
    ).toBe("target_not_higher");
  });
});

describe("buildSubscriptionUpgradeUpdateParams", () => {
  it("updates Stripe subscriptions with a negative credit for unused current plan value", () => {
    expect(
      buildSubscriptionUpgradeUpdateParams({
        creditAmount: 5833,
        currency: "usd",
        currentProductUuid: "product_basic",
        itemId: "si_123",
        localSubscriptionUuid: "local_sub",
        stripeSubscriptionId: "sub_123",
        subscriptionChangeUuid: "log_123",
        targetPlatformPriceId: "price_pro",
        targetPlatformProductId: "prod_pro",
        targetProductUuid: "product_pro",
        userUuid: "user_123",
      }),
    ).toEqual({
      add_invoice_items: [
        {
          metadata: {
            action: "upgrade",
            fromProductUuid: "product_basic",
            localSubscriptionId: "local_sub",
            stripeSubscriptionId: "sub_123",
            stripeSubscriptionItemId: "si_123",
            subscriptionChangeUuid: "log_123",
            targetPlatformPriceId: "price_pro",
            targetPlatformProductId: "prod_pro",
            toProductUuid: "product_pro",
            userId: "user_123",
          },
          price_data: {
            currency: "usd",
            product: "prod_UQeecNrskPRv96",
            unit_amount: -5833,
          },
          quantity: 1,
        },
      ],
      billing_cycle_anchor: "now",
      cancel_at_period_end: false,
      expand: ["latest_invoice"],
      items: [
        {
          id: "si_123",
          price: "price_pro",
        },
      ],
      payment_behavior: "error_if_incomplete",
      proration_behavior: "none",
    });
  });
});

describe("calculateSubscriptionUpgradeDifference", () => {
  it("returns the unused current monthly plan credit", () => {
    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          recurring: { interval: "month", interval_count: 1 },
          unit_amount: 1000,
        },
        currentPeriodEnd: periodEnd,
        currentPeriodStart: periodStart,
        now: new Date("2026-04-15T00:00:00.000Z"),
        target: {
          currency: "usd",
          recurring: { interval: "month", interval_count: 1 },
          unit_amount: 2000,
        },
      }),
    ).toEqual({
      amount: 1000,
      currency: "usd",
    });
  });

  it("returns annual credit by remaining whole months", () => {
    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          recurring: { interval: "year", interval_count: 1 },
          unit_amount: 10000,
        },
        currentPeriodEnd: new Date("2027-01-01T00:00:00.000Z"),
        currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
        now: new Date("2026-06-01T00:00:00.000Z"),
        target: {
          currency: "usd",
          recurring: { interval: "year", interval_count: 1 },
          unit_amount: 20000,
        },
      }),
    ).toEqual({
      amount: 5833,
      currency: "usd",
    });
  });

  it("returns only the current monthly credit for cross-interval upgrades", () => {
    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          recurring: { interval: "month", interval_count: 1 },
          unit_amount: 1000,
        },
        currentPeriodEnd: periodEnd,
        currentPeriodStart: periodStart,
        now: new Date("2026-04-15T00:00:00.000Z"),
        target: {
          currency: "usd",
          recurring: { interval: "year", interval_count: 1 },
          unit_amount: 20000,
        },
      }),
    ).toEqual({
      amount: 1000,
      currency: "usd",
    });
  });

  it("rejects missing amounts, invalid recurring prices, and currency changes", () => {
    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          recurring: { interval: "month", interval_count: 1 },
          unit_amount: null,
        },
        currentPeriodEnd: periodEnd,
        currentPeriodStart: periodStart,
        now,
        target: {
          currency: "usd",
          recurring: { interval: "month", interval_count: 1 },
          unit_amount: 2000,
        },
      }),
    ).toBeNull();

    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          recurring: { interval: "month", interval_count: 1 },
          unit_amount: 1000,
        },
        currentPeriodEnd: periodEnd,
        currentPeriodStart: periodStart,
        now,
        target: {
          currency: "eur",
          recurring: { interval: "month", interval_count: 1 },
          unit_amount: 2000,
        },
      }),
    ).toBeNull();

    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          recurring: null,
          unit_amount: 1000,
        },
        currentPeriodEnd: periodEnd,
        currentPeriodStart: periodStart,
        now,
        target: {
          currency: "usd",
          recurring: { interval: "month", interval_count: 1 },
          unit_amount: 2000,
        },
      }),
    ).toBeNull();
  });
});
