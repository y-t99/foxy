import { describe, expect, it } from "vitest";
import { hasSubscriptionAccess } from "./subscription-access";

const future = new Date("2030-01-01T00:00:00.000Z");
const past = new Date("2020-01-01T00:00:00.000Z");
const now = new Date("2026-04-16T00:00:00.000Z");

describe("hasSubscriptionAccess", () => {
  it("allows active subscriptions before the current period ends", () => {
    expect(
      hasSubscriptionAccess({
        currentPeriodEnd: future,
        now,
        status: "active",
      }),
    ).toBe(true);
  });

  it("allows active subscriptions that are scheduled to cancel at period end", () => {
    expect(
      hasSubscriptionAccess({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: future,
        now,
        status: "active",
      }),
    ).toBe(true);
  });

  it("denies active subscriptions after the current period ends", () => {
    expect(
      hasSubscriptionAccess({
        currentPeriodEnd: past,
        now,
        status: "active",
      }),
    ).toBe(false);
  });

  it.each(["incomplete", "incomplete_expired", "past_due", "unpaid", "canceled"])(
    "denies %s subscriptions",
    (status) => {
      expect(
        hasSubscriptionAccess({
          currentPeriodEnd: future,
          now,
          status,
        }),
      ).toBe(false);
    },
  );
});
