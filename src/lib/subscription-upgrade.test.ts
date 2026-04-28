import { describe, expect, it } from "vitest";
import {
  buildSubscriptionUpgradeCheckoutParams,
  buildSubscriptionUpgradeUpdateParams,
  calculateSubscriptionUpgradeDifference,
  getSubscriptionUpgradeIssue,
} from "./subscription-upgrade";

const future = new Date("2030-01-01T00:00:00.000Z");
const past = new Date("2020-01-01T00:00:00.000Z");
const now = new Date("2026-04-28T00:00:00.000Z");

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
  });
});

describe("buildSubscriptionUpgradeUpdateParams", () => {
  it("updates Stripe subscriptions without collecting another prorated difference", () => {
    expect(
      buildSubscriptionUpgradeUpdateParams({
        itemId: "si_123",
        targetPlatformPriceId: "price_pro",
      }),
    ).toEqual({
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

describe("buildSubscriptionUpgradeCheckoutParams", () => {
  it("builds a one-time payment checkout for the plan difference", () => {
    expect(
      buildSubscriptionUpgradeCheckoutParams({
        amount: 1000,
        appUrl: "https://app.example",
        currency: "usd",
        currentProductUuid: "product_basic",
        localSubscriptionUuid: "local_sub",
        stripeSubscriptionId: "sub_123",
        stripeSubscriptionItemId: "si_123",
        subscriptionChangeUuid: "log_123",
        targetPlatformPriceId: "price_pro",
        targetPlatformProductId: "prod_pro",
        targetProductName: "Pro Plan",
        targetProductUuid: "product_pro",
        userUuid: "user_123",
      }),
    ).toEqual({
      cancel_url: "https://app.example/dashboard?upgrade=cancelled",
      client_reference_id: "user_123",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pro Plan upgrade difference",
            },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
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
      mode: "payment",
      success_url: "https://app.example/dashboard?upgrade=pending",
    });
  });
});

describe("calculateSubscriptionUpgradeDifference", () => {
  it("returns the positive same-currency amount difference", () => {
    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          unit_amount: 1000,
        },
        target: {
          currency: "usd",
          unit_amount: 2000,
        },
      }),
    ).toEqual({
      amount: 1000,
      currency: "usd",
    });
  });

  it("rejects missing amounts, non-positive differences, and currency changes", () => {
    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          unit_amount: null,
        },
        target: {
          currency: "usd",
          unit_amount: 2000,
        },
      }),
    ).toBeNull();

    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          unit_amount: 2000,
        },
        target: {
          currency: "usd",
          unit_amount: 2000,
        },
      }),
    ).toBeNull();

    expect(
      calculateSubscriptionUpgradeDifference({
        current: {
          currency: "usd",
          unit_amount: 1000,
        },
        target: {
          currency: "eur",
          unit_amount: 2000,
        },
      }),
    ).toBeNull();
  });
});
