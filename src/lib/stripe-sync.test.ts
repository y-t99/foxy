import { describe, expect, it } from "vitest";
import { getUpgradeCheckoutSessionMetadata } from "./stripe-sync";

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
