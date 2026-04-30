import { describe, expect, it } from "vitest";
import {
  getSubscriptionProductByKey,
  getSubscriptionProductConfiguredPlatformProductId,
  getSubscriptionProductPlatformPriceId,
  isSubscriptionProductUpgradeTarget,
  resolveStripeProductIdFromPrice,
  SUBSCRIPTION_PRODUCTS,
} from "./products";

describe("SUBSCRIPTION_PRODUCTS", () => {
  it("keeps Basic and Pro monthly products and adds annual products", () => {
    expect(
      SUBSCRIPTION_PRODUCTS.map((product) => ({
        env: product.env,
        intervalMonths: product.intervalMonths,
        key: product.key,
        level: product.level,
        name: product.name,
        platform: product.platform,
        price: product.price,
        stripePriceId: product.stripePriceId,
      })),
    ).toEqual([
      {
        env: {
          priceId: "STRIPE_PRICE_ID",
          productId: "STRIPE_PRODUCT_ID",
        },
        intervalMonths: 1,
        key: "basic",
        level: 1,
        name: "Basic Plan",
        platform: "stripe",
        price: "$10.00",
        stripePriceId: undefined,
      },
      {
        env: {
          priceId: "STRIPE_PRO_PRICE_ID",
          productId: "STRIPE_PRO_PRODUCT_ID",
        },
        intervalMonths: 1,
        key: "pro",
        level: 2,
        name: "Pro Plan",
        platform: "stripe",
        price: "$20.00 USD",
        stripePriceId: undefined,
      },
      {
        env: {},
        intervalMonths: 12,
        key: "basic_annual",
        level: 1,
        name: "Basic Plan Annual",
        platform: "stripe",
        price: "$100.00 USD / year",
        stripePriceId: "price_1TRnklRxCAAlii2EMOddBstc",
      },
      {
        env: {},
        intervalMonths: 12,
        key: "pro_annual",
        level: 2,
        name: "Pro Plan Annual",
        platform: "stripe",
        price: "$200.00 USD / year",
        stripePriceId: "price_1TRnlMRxCAAlii2EICpMtBjB",
      },
    ]);
  });

  it("finds a subscription product by key", () => {
    expect(getSubscriptionProductByKey("pro_annual")?.name).toBe(
      "Pro Plan Annual",
    );
    expect(getSubscriptionProductByKey("missing")).toBeNull();
  });

  it("reads literal annual Stripe price ids without requiring per-plan env vars", () => {
    const product = getSubscriptionProductByKey("basic_annual");

    expect(product).not.toBeNull();
    expect(getSubscriptionProductPlatformPriceId(product!)).toBe(
      "price_1TRnklRxCAAlii2EMOddBstc",
    );
    expect(getSubscriptionProductConfiguredPlatformProductId(product!)).toBeNull();
  });

  it("resolves Stripe product ids from retrieved price data", () => {
    expect(resolveStripeProductIdFromPrice({ product: "prod_annual" })).toBe(
      "prod_annual",
    );
    expect(resolveStripeProductIdFromPrice({ product: { id: "prod_object" } })).toBe(
      "prod_object",
    );
    expect(resolveStripeProductIdFromPrice({ product: null })).toBeNull();
  });

  it("allows same-level monthly products to upgrade to annual products", () => {
    const basic = getSubscriptionProductByKey("basic");
    const basicAnnual = getSubscriptionProductByKey("basic_annual");
    const pro = getSubscriptionProductByKey("pro");
    const proAnnual = getSubscriptionProductByKey("pro_annual");

    expect(
      isSubscriptionProductUpgradeTarget({
        currentProduct: basic!,
        targetProduct: basicAnnual!,
      }),
    ).toBe(true);
    expect(
      isSubscriptionProductUpgradeTarget({
        currentProduct: pro!,
        targetProduct: proAnnual!,
      }),
    ).toBe(true);
    expect(
      isSubscriptionProductUpgradeTarget({
        currentProduct: basicAnnual!,
        targetProduct: basic!,
      }),
    ).toBe(false);
  });
});
