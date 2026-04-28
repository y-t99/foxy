import type Stripe from "stripe";
import { getAppUrl, getRequiredEnv } from "@/lib/env";
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
    cancel_at_period_end: false,
    expand: ["latest_invoice"],
    items: [
      {
        id: itemId,
        price: targetPlatformPriceId,
      },
    ],
    payment_behavior: "error_if_incomplete",
    proration_behavior: "none",
  };
}

export function buildSubscriptionUpgradeCheckoutParams({
  amount,
  appUrl,
  currency,
  currentProductUuid,
  localSubscriptionUuid,
  stripeSubscriptionId,
  stripeSubscriptionItemId,
  subscriptionChangeUuid,
  targetPlatformPriceId,
  targetPlatformProductId,
  targetProductName,
  targetProductUuid,
  userUuid,
}: {
  amount: number;
  appUrl: string;
  currency: string;
  currentProductUuid: string;
  localSubscriptionUuid: string;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId: string;
  subscriptionChangeUuid: string;
  targetPlatformPriceId: string;
  targetPlatformProductId: string;
  targetProductName: string;
  targetProductUuid: string;
  userUuid: string;
}): Stripe.Checkout.SessionCreateParams {
  return {
    cancel_url: `${appUrl}/dashboard?upgrade=cancelled`,
    client_reference_id: userUuid,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `${targetProductName} upgrade difference`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      action: "upgrade",
      fromProductUuid: currentProductUuid,
      localSubscriptionId: localSubscriptionUuid,
      stripeSubscriptionId,
      stripeSubscriptionItemId,
      subscriptionChangeUuid,
      targetPlatformPriceId,
      targetPlatformProductId,
      toProductUuid: targetProductUuid,
      userId: userUuid,
    },
    mode: "payment",
    success_url: `${appUrl}/dashboard?upgrade=pending`,
  };
}

export function calculateSubscriptionUpgradeDifference({
  current,
  target,
}: {
  current: Pick<Stripe.Price, "currency" | "unit_amount">;
  target: Pick<Stripe.Price, "currency" | "unit_amount">;
}) {
  if (
    current.currency !== target.currency ||
    current.unit_amount == null ||
    target.unit_amount == null
  ) {
    return null;
  }

  const amount = target.unit_amount - current.unit_amount;

  if (amount <= 0) {
    return null;
  }

  return {
    amount,
    currency: target.currency,
  };
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

    return priceIssue ? null : stripePrice;
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

function getFirstSubscriptionItemPrice(subscription: Stripe.Subscription) {
  const price = subscription.items.data[0]?.price;

  return typeof price === "object" && price !== null ? price : null;
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

  const targetStripePrice = await validateStripePrice({
    platformPriceId: targetPlatformPriceId,
    platformProductId: targetPlatformProductId,
  });

  if (!targetStripePrice) {
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
  const currentStripePrice = getFirstSubscriptionItemPrice(stripeSubscription);

  if (!itemId || !currentStripePrice) {
    throw new SubscriptionUpgradeError("subscription_missing");
  }

  const difference = calculateSubscriptionUpgradeDifference({
    current: currentStripePrice,
    target: targetStripePrice,
  });

  if (!difference) {
    throw new SubscriptionUpgradeError("stripe_api");
  }

  const subscriptionLog = await prisma.subscriptionLog.create({
    data: {
      action: "upgrade",
      platform: "stripe",
      result: {
        differenceAmount: difference.amount,
        differenceCurrency: difference.currency,
        fromProductUuid: subscription.productUuid,
        stripeSubscriptionId: stripeSubscription.id,
        stripeSubscriptionItemId: itemId,
        targetPlatformPriceId,
        targetPlatformProductId,
        toProductUuid: target.product.uuid,
      },
      status: "pending",
      subscriptionUuid: subscription.uuid,
      userUuid,
    },
  });

  let checkoutSession: Stripe.Checkout.Session;
  const checkoutParams = buildSubscriptionUpgradeCheckoutParams({
    amount: difference.amount,
    appUrl: getAppUrl(),
    currency: difference.currency,
    currentProductUuid: subscription.productUuid,
    localSubscriptionUuid: subscription.uuid,
    stripeSubscriptionId: stripeSubscription.id,
    stripeSubscriptionItemId: itemId,
    subscriptionChangeUuid: subscriptionLog.uuid,
    targetPlatformPriceId,
    targetPlatformProductId,
    targetProductName: target.product.name,
    targetProductUuid: target.product.uuid,
    userUuid,
  });

  if (subscription.platform.platformCustomerId) {
    checkoutParams.customer = subscription.platform.platformCustomerId;
  }

  try {
    checkoutSession = await getStripe().checkout.sessions.create(checkoutParams);
  } catch (error) {
    await prisma.subscriptionLog.update({
      data: {
        result: {
          differenceAmount: difference.amount,
          differenceCurrency: difference.currency,
          failedAt: new Date().toISOString(),
          failureReason: "stripe_api",
          fromProductUuid: subscription.productUuid,
          stripeSubscriptionId: stripeSubscription.id,
          stripeSubscriptionItemId: itemId,
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

  await prisma.subscriptionLog.update({
    data: {
      result: {
        checkoutSessionId: checkoutSession.id,
        differenceAmount: difference.amount,
        differenceCurrency: difference.currency,
        fromProductUuid: subscription.productUuid,
        stripeSubscriptionId: stripeSubscription.id,
        stripeSubscriptionItemId: itemId,
        targetPlatformPriceId,
        targetPlatformProductId,
        toProductUuid: target.product.uuid,
      },
    },
    where: { uuid: subscriptionLog.uuid },
  });

  return {
    checkoutUrl: checkoutSession.url ?? null,
    subscriptionChangeUuid: subscriptionLog.uuid,
  };
}
