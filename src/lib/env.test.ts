import { afterEach, describe, expect, it } from "vitest";
import { getStripeCheckoutConfigStatus } from "./env";

const originalEnv = process.env;

afterEach(() => {
  process.env = originalEnv;
});

describe("getStripeCheckoutConfigStatus", () => {
  it("treats placeholder Stripe secrets as unavailable billing config", () => {
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_ID: "price_123",
      STRIPE_PRO_PRICE_ID: "price_pro_123",
      STRIPE_PRO_PRODUCT_ID: "prod_pro_123",
      STRIPE_PRODUCT_ID: "prod_123",
      STRIPE_SECRET_KEY: "sk_test_replace_me",
    };

    expect(getStripeCheckoutConfigStatus()).toEqual({
      isReady: false,
      missing: ["STRIPE_SECRET_KEY"],
    });
  });

  it("accepts real-looking Stripe billing values", () => {
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_ID: "price_123",
      STRIPE_PRO_PRICE_ID: "price_pro_123",
      STRIPE_PRO_PRODUCT_ID: "prod_pro_123",
      STRIPE_PRODUCT_ID: "prod_123",
      STRIPE_SECRET_KEY: "sk_test_1234567890",
    };

    expect(getStripeCheckoutConfigStatus()).toEqual({
      isReady: true,
      missing: [],
    });
  });

  it("requires the Pro Plan Stripe ids for checkout readiness", () => {
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_ID: "price_123",
      STRIPE_PRODUCT_ID: "prod_123",
      STRIPE_SECRET_KEY: "sk_test_1234567890",
    };

    expect(getStripeCheckoutConfigStatus()).toEqual({
      isReady: false,
      missing: ["STRIPE_PRO_PRODUCT_ID", "STRIPE_PRO_PRICE_ID"],
    });
  });
});
