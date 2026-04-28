import { describe, expect, it } from "vitest";
import {
  buildSubscriptionUpgradeUpdateParams,
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
  it("uses Stripe subscription updates with pending payment behavior", () => {
    expect(
      buildSubscriptionUpgradeUpdateParams({
        itemId: "si_123",
        targetPlatformPriceId: "price_pro",
      }),
    ).toEqual({
      expand: ["latest_invoice"],
      items: [
        {
          id: "si_123",
          price: "price_pro",
        },
      ],
      payment_behavior: "pending_if_incomplete",
      proration_behavior: "always_invoice",
    });
  });
});
