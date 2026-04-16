import { describe, expect, it } from "vitest";
import { getStripeSubscriptionPriceIssue } from "./stripe-price";

describe("getStripeSubscriptionPriceIssue", () => {
  it("rejects one-time prices in subscription mode", () => {
    expect(
      getStripeSubscriptionPriceIssue({
        expectedProductId: "prod_123",
        price: {
          product: "prod_123",
          recurring: null,
        },
      }),
    ).toBe("price_recurring");
  });

  it("rejects prices that do not belong to the configured product", () => {
    expect(
      getStripeSubscriptionPriceIssue({
        expectedProductId: "prod_123",
        price: {
          product: "prod_other",
          recurring: {
            interval: "month",
          },
        },
      }),
    ).toBe("price_product");
  });

  it("accepts recurring prices attached to the configured product", () => {
    expect(
      getStripeSubscriptionPriceIssue({
        expectedProductId: "prod_123",
        price: {
          product: "prod_123",
          recurring: {
            interval: "month",
          },
        },
      }),
    ).toBeNull();
  });
});
