import { describe, expect, it } from "vitest";
import {
  getPendingUpgradeFailureStatus,
  getUpgradeCheckoutSessionMetadata,
  getUpgradeInvoiceMetadata,
} from "./stripe-sync";

describe("getUpgradeCheckoutSessionMetadata", () => {
  it("extracts required upgrade checkout metadata", () => {
    expect(
      getUpgradeCheckoutSessionMetadata({
        metadata: {
          action: "upgrade",
          localSubscriptionId: "local_sub",
          stripeSubscriptionId: "sub_123",
          stripeSubscriptionItemId: "si_123",
          subscriptionChangeUuid: "log_123",
          targetPlatformPriceId: "price_pro",
          toProductUuid: "product_pro",
        },
      }),
    ).toEqual({
      localSubscriptionId: "local_sub",
      stripeSubscriptionId: "sub_123",
      stripeSubscriptionItemId: "si_123",
      subscriptionChangeUuid: "log_123",
      targetPlatformPriceId: "price_pro",
      toProductUuid: "product_pro",
    });
  });

  it("returns null for non-upgrade or incomplete checkout metadata", () => {
    expect(
      getUpgradeCheckoutSessionMetadata({
        metadata: {
          action: "subscribe",
        },
      }),
    ).toBeNull();

    expect(
      getUpgradeCheckoutSessionMetadata({
        metadata: {
          action: "upgrade",
          subscriptionChangeUuid: "log_123",
        },
      }),
    ).toBeNull();
  });
});

describe("getUpgradeInvoiceMetadata", () => {
  it("extracts required upgrade invoice metadata", () => {
    expect(
      getUpgradeInvoiceMetadata({
        metadata: {
          action: "upgrade",
          localSubscriptionId: "local_sub",
          stripeSubscriptionId: "sub_123",
          stripeSubscriptionItemId: "si_123",
          subscriptionChangeUuid: "log_123",
          targetPlatformPriceId: "price_pro",
          toProductUuid: "product_pro",
        },
      }),
    ).toEqual({
      localSubscriptionId: "local_sub",
      stripeSubscriptionId: "sub_123",
      stripeSubscriptionItemId: "si_123",
      subscriptionChangeUuid: "log_123",
      targetPlatformPriceId: "price_pro",
      toProductUuid: "product_pro",
    });
  });

  it("returns null for non-upgrade or incomplete invoice metadata", () => {
    expect(
      getUpgradeInvoiceMetadata({
        metadata: {
          action: "subscribe",
        },
      }),
    ).toBeNull();

    expect(
      getUpgradeInvoiceMetadata({
        metadata: {
          action: "upgrade",
          subscriptionChangeUuid: "log_123",
        },
      }),
    ).toBeNull();
  });
});

describe("getPendingUpgradeFailureStatus", () => {
  it("keeps automatically advancing failed invoices pending while Stripe will retry", () => {
    expect(
      getPendingUpgradeFailureStatus({
        auto_advance: true,
        next_payment_attempt: 1777392000,
      }),
    ).toBe("pending");
  });

  it("marks failed invoices terminal when Stripe will not retry automatically", () => {
    expect(
      getPendingUpgradeFailureStatus({
        auto_advance: false,
        next_payment_attempt: null,
      }),
    ).toBe("failed");
  });
});
