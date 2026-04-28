import type Stripe from "stripe";
import { getRequiredEnv } from "@/lib/env";
import {
  ensureSubscriptionProduct,
  getSubscriptionProductByKey,
  type SubscriptionProductKey,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getStripeSubscriptionPriceIssue } from "@/lib/stripe-price";

export type SubscriptionUpgradeIssue =
  | "subscription_missing"
  | "subscription_inactive"
  | "subscription_expired"
  | "target_not_higher";

type SubscriptionUpgradeInput = {
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: Date | null;
  currentProductLevel?: number | null;
  now?: Date;
  status?: string | null;
  targetProductLevel?: number | null;
};

type CreateSubscriptionUpgradeSessionInput = {
  targetProductKey?: SubscriptionProductKey;
  targetProductUuid?: string;
  userUuid: string;
};

export class SubscriptionUpgradeError extends Error {
  constructor(public readonly issue: SubscriptionUpgradeIssue | "stripe_api") {
    super(issue);
  }
}

export function buildSubscriptionUpgradeUpdateParams({
  itemId,
  targetPlatformPriceId,
}: {
  itemId: string;
  targetPlatformPriceId: string;
}): Stripe.SubscriptionUpdateParams {
  return {
    expand: ["latest_invoice"],
    items: [
      {
        id: itemId,
        price: targetPlatformPriceId,
      },
    ],
    payment_behavior: "pending_if_incomplete",
    proration_behavior: "always_invoice",
  };
}

function stripeInvoice(value: Stripe.Subscription["latest_invoice"]) {
  return typeof value === "object" && value !== null ? value : null;
}

export function getSubscriptionUpgradeIssue({
  currentPeriodEnd,
  currentProductLevel,
  now = new Date(),
  status,
  targetProductLevel,
}: SubscriptionUpgradeInput): SubscriptionUpgradeIssue | null {
  if (!status || currentProductLevel == null || targetProductLevel == null) {
    return "subscription_missing";
  }

  if (status !== "active") {
    return "subscription_inactive";
  }

  if (!currentPeriodEnd || currentPeriodEnd.getTime() <= now.getTime()) {
    return "subscription_expired";
  }

  if (targetProductLevel <= currentProductLevel) {
    return "target_not_higher";
  }

  return null;
}

function isStripeSdkError(error: unknown): error is { message: string; type: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "type" in error &&
    typeof error.message === "string" &&
    typeof error.type === "string" &&
    error.type.startsWith("Stripe")
  );
}

async function getTargetProduct({
  targetProductKey,
  targetProductUuid,
}: Pick<
  CreateSubscriptionUpgradeSessionInput,
  "targetProductKey" | "targetProductUuid"
>) {
  if (targetProductKey) {
    const productConfig = getSubscriptionProductByKey(targetProductKey);

    if (!productConfig) {
      return null;
    }

    const product = await ensureSubscriptionProduct(productConfig.key);
    const platform = product.platforms?.[0];

    return { product, productConfig, platform };
  }

  if (!targetProductUuid) {
    return null;
  }

  const product = await prisma.product.findUnique({
    include: {
      platforms: {
        where: { platform: "stripe" },
      },
    },
    where: { uuid: targetProductUuid },
  });

  if (!product) {
    return null;
  }

  const platform = product.platforms[0];

  return {
    product,
    productConfig: null,
    platform,
  };
}

async function validateStripePrice({
  platformPriceId,
  platformProductId,
}: {
  platformPriceId: string;
  platformProductId: string;
}) {
  try {
    const stripePrice = await getStripe().prices.retrieve(platformPriceId);
    const priceIssue = getStripeSubscriptionPriceIssue({
      expectedProductId: platformProductId,
      price: stripePrice,
    });

    return priceIssue;
  } catch (error) {
    if (isStripeSdkError(error)) {
      throw new SubscriptionUpgradeError("stripe_api");
    }

    throw error;
  }
}

function getFirstSubscriptionItemId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.id ?? null;
}

export async function createSubscriptionUpgradeSession({
  targetProductKey,
  targetProductUuid,
  userUuid,
}: CreateSubscriptionUpgradeSessionInput) {
  const target = await getTargetProduct({ targetProductKey, targetProductUuid });

  if (!target?.platform) {
    throw new SubscriptionUpgradeError("target_not_higher");
  }

  const targetPlatformPriceId =
    target.productConfig?.env.priceId != null
      ? getRequiredEnv(target.productConfig.env.priceId)
      : target.platform.platformPriceId;
  const targetPlatformProductId =
    target.productConfig?.env.productId != null
      ? getRequiredEnv(target.productConfig.env.productId)
      : target.platform.platformProductId;

  const subscription = await prisma.subscription.findFirst({
    include: {
      platform: true,
      product: true,
    },
    orderBy: { updatedAt: "desc" },
    where: { userUuid },
  });

  const issue = getSubscriptionUpgradeIssue({
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    currentProductLevel: subscription?.product.level,
    status: subscription?.status,
    targetProductLevel: target.product.level,
  });

  if (issue) {
    throw new SubscriptionUpgradeError(issue);
  }

  if (!subscription?.platform?.platformSubscriptionId) {
    throw new SubscriptionUpgradeError("subscription_missing");
  }

  const priceIssue = await validateStripePrice({
    platformPriceId: targetPlatformPriceId,
    platformProductId: targetPlatformProductId,
  });

  if (priceIssue) {
    throw new SubscriptionUpgradeError("stripe_api");
  }

  let stripeSubscription: Stripe.Subscription;

  try {
    stripeSubscription = await getStripe().subscriptions.retrieve(
      subscription.platform.platformSubscriptionId,
      { expand: ["items.data.price"] },
    );
  } catch (error) {
    if (isStripeSdkError(error)) {
      throw new SubscriptionUpgradeError("stripe_api");
    }

    throw error;
  }
  const itemId = getFirstSubscriptionItemId(stripeSubscription);

  if (!itemId) {
    throw new SubscriptionUpgradeError("subscription_missing");
  }

  const subscriptionLog = await prisma.subscriptionLog.create({
    data: {
      action: "upgrade",
      platform: "stripe",
      result: {
        fromProductUuid: subscription.productUuid,
        targetPlatformPriceId,
        targetPlatformProductId,
        toProductUuid: target.product.uuid,
      },
      status: "pending",
      subscriptionUuid: subscription.uuid,
      userUuid,
    },
  });

  let updatedStripeSubscription: Stripe.Subscription;

  try {
    updatedStripeSubscription = await getStripe().subscriptions.update(
      stripeSubscription.id,
      buildSubscriptionUpgradeUpdateParams({
        itemId,
        targetPlatformPriceId,
      }),
    );
  } catch (error) {
    await prisma.subscriptionLog.update({
      data: {
        result: {
          failedAt: new Date().toISOString(),
          failureReason: "stripe_api",
          fromProductUuid: subscription.productUuid,
          targetPlatformPriceId,
          targetPlatformProductId,
          toProductUuid: target.product.uuid,
        },
        status: "failed",
      },
      where: { uuid: subscriptionLog.uuid },
    });

    if (isStripeSdkError(error)) {
      throw new SubscriptionUpgradeError("stripe_api");
    }

    throw error;
  }

  const latestInvoice = stripeInvoice(updatedStripeSubscription.latest_invoice);

  await prisma.subscriptionLog.update({
    data: {
      result: {
        fromProductUuid: subscription.productUuid,
        hostedInvoiceUrl: latestInvoice?.hosted_invoice_url ?? null,
        invoiceId: latestInvoice?.id ?? null,
        stripeSubscriptionId: updatedStripeSubscription.id,
        targetPlatformPriceId,
        targetPlatformProductId,
        toProductUuid: target.product.uuid,
      },
    },
    where: { uuid: subscriptionLog.uuid },
  });

  return {
    checkoutUrl: latestInvoice?.hosted_invoice_url ?? null,
    subscriptionChangeUuid: subscriptionLog.uuid,
  };
}
