import type Stripe from "stripe";
import {
  ensureSubscriptionProduct,
  getSubscriptionProductByKey,
  getSubscriptionProductConfiguredPlatformProductId,
  getSubscriptionProductPlatformPriceId,
  resolveStripeProductIdFromPrice,
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
  currentIntervalMonths?: number | null;
  currentPeriodEnd?: Date | null;
  currentProductLevel?: number | null;
  now?: Date;
  status?: string | null;
  targetIntervalMonths?: number | null;
  targetProductLevel?: number | null;
};

type CreateSubscriptionUpgradeSessionInput = {
  targetProductKey?: SubscriptionProductKey;
  targetProductUuid?: string;
  userUuid: string;
};

type SubscriptionUpgradeMetadataInput = {
  currentProductUuid: string;
  localSubscriptionUuid: string;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId: string;
  subscriptionChangeUuid: string;
  targetPlatformPriceId: string;
  targetPlatformProductId: string;
  targetProductUuid: string;
  userUuid: string;
};

const SUBSCRIPTION_UPGRADE_ADJUSTMENT_PRODUCT_ID = "prod_UQeecNrskPRv96";

type StripeObjectRef = string | { id: string } | null | undefined;
type StripePriceForUpgrade = {
  currency: string;
  recurring: {
    interval?: string;
    interval_count?: number | null;
  } | null;
  unit_amount: number | null;
};

export class SubscriptionUpgradeError extends Error {
  constructor(public readonly issue: SubscriptionUpgradeIssue | "stripe_api") {
    super(issue);
  }
}

export function buildSubscriptionUpgradeUpdateParams({
  creditAmount,
  currency,
  currentProductUuid,
  itemId,
  localSubscriptionUuid,
  stripeSubscriptionId,
  subscriptionChangeUuid,
  targetPlatformPriceId,
  targetPlatformProductId,
  targetProductUuid,
  userUuid,
}: {
  creditAmount: number;
  currency: string;
  currentProductUuid: string;
  itemId: string;
  localSubscriptionUuid: string;
  stripeSubscriptionId: string;
  subscriptionChangeUuid: string;
  targetPlatformPriceId: string;
  targetPlatformProductId: string;
  targetProductUuid: string;
  userUuid: string;
}): Stripe.SubscriptionUpdateParams {
  return {
    add_invoice_items: [
      {
        metadata: buildSubscriptionUpgradeMetadata({
          currentProductUuid,
          localSubscriptionUuid,
          stripeSubscriptionId,
          stripeSubscriptionItemId: itemId,
          subscriptionChangeUuid,
          targetPlatformPriceId,
          targetPlatformProductId,
          targetProductUuid,
          userUuid,
        }),
        price_data: {
          currency,
          product: SUBSCRIPTION_UPGRADE_ADJUSTMENT_PRODUCT_ID,
          unit_amount: -creditAmount,
        },
        quantity: 1,
      },
    ],
    billing_cycle_anchor: "now",
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

function buildSubscriptionUpgradeMetadata({
  currentProductUuid,
  localSubscriptionUuid,
  stripeSubscriptionId,
  stripeSubscriptionItemId,
  subscriptionChangeUuid,
  targetPlatformPriceId,
  targetPlatformProductId,
  targetProductUuid,
  userUuid,
}: SubscriptionUpgradeMetadataInput) {
  return {
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
  };
}

function stripeObjectId(value: StripeObjectRef) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function unixToDate(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];

  return {
    currentPeriodEnd: unixToDate(item?.current_period_end),
    currentPeriodStart: unixToDate(item?.current_period_start),
  };
}

export function calculateSubscriptionUpgradeDifference({
  current,
  currentPeriodEnd,
  currentPeriodStart,
  now = new Date(),
  target,
}: {
  current: StripePriceForUpgrade;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  now?: Date;
  target: StripePriceForUpgrade;
}) {
  if (
    current.currency !== target.currency ||
    current.unit_amount == null ||
    target.unit_amount == null ||
    currentPeriodEnd.getTime() <= currentPeriodStart.getTime()
  ) {
    return null;
  }

  const currentIntervalMonths = getStripePriceIntervalMonths(current);
  const targetIntervalMonths = getStripePriceIntervalMonths(target);

  if (!currentIntervalMonths || !targetIntervalMonths) {
    return null;
  }

  const effectiveNow = new Date(
    Math.min(
      Math.max(now.getTime(), currentPeriodStart.getTime()),
      currentPeriodEnd.getTime(),
    ),
  );
  const usedCompleteMonths = getCompleteUtcMonthsBetween(
    currentPeriodStart,
    effectiveNow,
  );
  const remainingMonths = Math.max(
    currentIntervalMonths - Math.min(usedCompleteMonths, currentIntervalMonths),
    0,
  );

  if (remainingMonths <= 0) {
    return null;
  }

  const currentMonthlyAmount = current.unit_amount / currentIntervalMonths;
  const amount = Math.round(currentMonthlyAmount * remainingMonths);

  if (amount <= 0) {
    return null;
  }

  return {
    amount,
    currency: target.currency,
  };
}

function getStripePriceIntervalMonths(price: StripePriceForUpgrade) {
  const intervalCount = price.recurring?.interval_count ?? 1;

  if (!Number.isInteger(intervalCount) || intervalCount <= 0) {
    return null;
  }

  if (price.recurring?.interval === "month") {
    return intervalCount;
  }

  if (price.recurring?.interval === "year") {
    return intervalCount * 12;
  }

  return null;
}

function addUtcMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const targetMonthStart = new Date(Date.UTC(year, month, 1));
  const nextMonthStart = new Date(Date.UTC(year, month + 1, 1));
  const lastDayOfTargetMonth = new Date(
    nextMonthStart.getTime() - 24 * 60 * 60 * 1000,
  ).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastDayOfTargetMonth);

  return new Date(
    Date.UTC(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth(),
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

function getCompleteUtcMonthsBetween(start: Date, end: Date) {
  if (end.getTime() <= start.getTime()) {
    return 0;
  }

  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());

  if (addUtcMonths(start, months).getTime() > end.getTime()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

export function getSubscriptionUpgradeIssue({
  currentIntervalMonths,
  currentPeriodEnd,
  currentProductLevel,
  now = new Date(),
  status,
  targetIntervalMonths,
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

  if (
    targetProductLevel < currentProductLevel ||
    (targetProductLevel === currentProductLevel &&
      (!currentIntervalMonths ||
        !targetIntervalMonths ||
        targetIntervalMonths <= currentIntervalMonths))
  ) {
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
  expectedProductId,
  platformPriceId,
}: {
  expectedProductId: string | null;
  platformPriceId: string;
}) {
  try {
    const stripePrice = await getStripe().prices.retrieve(platformPriceId);
    const priceIssue = getStripeSubscriptionPriceIssue({
      expectedProductId,
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
    target.productConfig
      ? getSubscriptionProductPlatformPriceId(target.productConfig)
      : target.platform.platformPriceId;
  const configuredTargetPlatformProductId = target.productConfig
    ? getSubscriptionProductConfiguredPlatformProductId(target.productConfig)
    : target.platform.platformProductId;
  const expectedTargetPlatformProductId =
    configuredTargetPlatformProductId ?? target.platform.platformProductId;

  const targetStripePrice = await validateStripePrice({
    expectedProductId: expectedTargetPlatformProductId,
    platformPriceId: targetPlatformPriceId,
  });

  if (!targetStripePrice) {
    throw new SubscriptionUpgradeError("stripe_api");
  }

  const targetPlatformProductId =
    configuredTargetPlatformProductId ??
    resolveStripeProductIdFromPrice(targetStripePrice) ??
    target.platform.platformProductId;

  if (!targetPlatformProductId) {
    throw new SubscriptionUpgradeError("stripe_api");
  }

  const subscription = await prisma.subscription.findFirst({
    include: {
      platform: true,
      product: true,
    },
    orderBy: { updatedAt: "desc" },
    where: { userUuid },
  });

  if (!subscription?.platform?.platformSubscriptionId) {
    throw new SubscriptionUpgradeError("subscription_missing");
  }

  if (!subscription.platform.platformCustomerId) {
    throw new SubscriptionUpgradeError("subscription_missing");
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
  const currentPeriod = getSubscriptionPeriod(stripeSubscription);

  if (
    !itemId ||
    !currentStripePrice ||
    !currentPeriod.currentPeriodEnd ||
    !currentPeriod.currentPeriodStart
  ) {
    throw new SubscriptionUpgradeError("subscription_missing");
  }

  const issue = getSubscriptionUpgradeIssue({
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentIntervalMonths: getStripePriceIntervalMonths(currentStripePrice),
    currentPeriodEnd: subscription.currentPeriodEnd,
    currentProductLevel: subscription.product.level,
    status: subscription.status,
    targetIntervalMonths: getStripePriceIntervalMonths(targetStripePrice),
    targetProductLevel: target.product.level,
  });

  if (issue) {
    throw new SubscriptionUpgradeError(issue);
  }

  const credit = calculateSubscriptionUpgradeDifference({
    current: currentStripePrice,
    currentPeriodEnd: currentPeriod.currentPeriodEnd,
    currentPeriodStart: currentPeriod.currentPeriodStart,
    target: targetStripePrice,
  });

  if (!credit) {
    throw new SubscriptionUpgradeError("stripe_api");
  }

  const subscriptionLog = await prisma.subscriptionLog.create({
    data: {
      action: "upgrade",
      platform: "stripe",
      result: {
        creditAmount: credit.amount,
        creditCurrency: credit.currency,
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

  let updatedStripeSubscription: Stripe.Subscription;
  const updateParams = buildSubscriptionUpgradeUpdateParams({
    creditAmount: credit.amount,
    currency: credit.currency,
    currentProductUuid: subscription.productUuid,
    itemId,
    localSubscriptionUuid: subscription.uuid,
    stripeSubscriptionId: stripeSubscription.id,
    subscriptionChangeUuid: subscriptionLog.uuid,
    targetPlatformPriceId,
    targetPlatformProductId,
    targetProductUuid: target.product.uuid,
    userUuid,
  });

  try {
    updatedStripeSubscription = await getStripe().subscriptions.update(
      stripeSubscription.id,
      updateParams,
    );
  } catch (error) {
    await prisma.subscriptionLog.update({
      data: {
        result: {
          creditAmount: credit.amount,
          creditCurrency: credit.currency,
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

  const { currentPeriodEnd, currentPeriodStart } =
    getSubscriptionPeriod(updatedStripeSubscription);
  const completedAt = new Date();
  const latestInvoiceId = stripeObjectId(
    updatedStripeSubscription.latest_invoice as StripeObjectRef,
  );

  await prisma.$transaction([
    prisma.subscription.update({
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
        currentPeriodEnd,
        currentPeriodStart,
        latestPaymentAt: completedAt,
        productUuid: target.product.uuid,
        status: updatedStripeSubscription.status,
      },
      where: { uuid: subscription.uuid },
    }),
    prisma.subscriptionLog.update({
      data: {
        result: {
          completedAt: completedAt.toISOString(),
          creditAmount: credit.amount,
          creditCurrency: credit.currency,
          fromProductUuid: subscription.productUuid,
          invoiceId: latestInvoiceId,
          stripeSubscriptionId: updatedStripeSubscription.id,
          stripeSubscriptionItemId: itemId,
          targetPlatformPriceId,
          targetPlatformProductId,
          toProductUuid: target.product.uuid,
        },
        status: "completed",
      },
      where: { uuid: subscriptionLog.uuid },
    }),
  ]);

  return {
    checkoutUrl: null,
    subscriptionChangeUuid: subscriptionLog.uuid,
  };
}
