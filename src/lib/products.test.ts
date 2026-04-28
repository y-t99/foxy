import { describe, expect, it } from "vitest";
import { getSubscriptionProductByKey, SUBSCRIPTION_PRODUCTS } from "./products";

describe("SUBSCRIPTION_PRODUCTS", () => {
  it("keeps Basic Plan and adds Pro Plan as Stripe checkout products", () => {
    expect(
      SUBSCRIPTION_PRODUCTS.map((product) => ({
        env: product.env,
        key: product.key,
        level: product.level,
        name: product.name,
        platform: product.platform,
        price: product.price,
      })),
    ).toEqual([
      {
        env: {
          priceId: "STRIPE_PRICE_ID",
          productId: "STRIPE_PRODUCT_ID",
        },
        key: "basic",
        level: 1,
        name: "Basic Plan",
        platform: "stripe",
        price: "$10.00",
      },
      {
        env: {
          priceId: "STRIPE_PRO_PRICE_ID",
          productId: "STRIPE_PRO_PRODUCT_ID",
        },
        key: "pro",
        level: 2,
        name: "Pro Plan",
        platform: "stripe",
        price: "$20.00 USD",
      },
    ]);
  });

  it("finds a subscription product by key", () => {
    expect(getSubscriptionProductByKey("pro")?.name).toBe("Pro Plan");
    expect(getSubscriptionProductByKey("missing")).toBeNull();
  });
});
