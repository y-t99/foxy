import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { buildSubscriptionUpgradeUpdateParams } from "@/lib/subscription-upgrade";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

type SyncSubscriptionOptions = {
  localSubscriptionId?: string | null;
  paidAt?: Date | null;
  productId?: string | null;
  userId?: string | null;
};

type RecordStripeEventInput = {
  event: Stripe.Event;
  headersJson: string;
  payloadJson: string;
  receiveStatus?: string;
  signature: string;
  source?: string;
};

type StripeObjectRef = string | { id: string } | null | undefined;
type JsonRecord = Record<string, Prisma.JsonValue>;

function stripeObjectId(value: StripeObjectRef) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function jsonRecord(value: Prisma.JsonValue): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
}

function jsonString(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" ? value : null;
}

function metadataString(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
) {
  const value = metadata?.[key];

  return typeof value === "string" && value.length > 0 ? value : null;
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

function mergeLogResult(
  result: Prisma.JsonValue,
  patch: Record<string, Prisma.JsonValue>,
) {
  return {
    ...jsonRecord(result),
    ...patch,
  };
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

async function findLocalSubscription(
  subscription: Stripe.Subscription,
  options: SyncSubscriptionOptions,
) {
  const metadata = subscription.metadata ?? {};
  const localSubscriptionId =
    options.localSubscriptionId ?? metadata.localSubscriptionId;

  if (localSubscriptionId) {
    const localSubscription = await prisma.subscription.findUnique({
      where: { uuid: localSubscriptionId },
    });

    if (localSubscription) {
      return localSubscription;
    }
  }

  const platform = await prisma.subscriptionPlatform.findUnique({
    include: { subscription: true },
    where: {
      platform_platformSubscriptionId: {
        platform: "stripe",
        platformSubscriptionId: subscription.id,
      },
    },
  });

  if (platform) {
    return platform.subscription;
  }

  const userUuid = options.userId ?? metadata.userId;
  const productUuid = options.productId ?? metadata.productId;

  if (!userUuid || !productUuid) {
    return null;
  }

  return prisma.subscription.findFirst({
    orderBy: { updatedAt: "desc" },
    where: {
      productUuid,
      userUuid,
    },
  });
}

async function findPendingUpgradeLog(subscriptionId: string) {
  const platform = await prisma.subscriptionPlatform.findUnique({
    where: {
      platform_platformSubscriptionId: {
        platform: "stripe",
        platformSubscriptionId: subscriptionId,
      },
    },
  });

  if (!platform) {
    return null;
  }

  return prisma.subscriptionLog.findFirst({
    orderBy: { createdAt: "desc" },
    where: {
      action: "upgrade",
      platform: "stripe",
      status: "pending",
      subscriptionUuid: platform.subscriptionUuid,
    },
  });
}

async function findPendingUpgradeLogByMetadata(
  metadata: UpgradeCheckoutSessionMetadata,
) {
  return prisma.subscriptionLog.findFirst({
    where: {
      action: "upgrade",
      platform: "stripe",
      status: "pending",
      subscriptionUuid: metadata.localSubscriptionId,
      uuid: metadata.subscriptionChangeUuid,
    },
  });
}

function isUpgradeInvoice(invoice: Stripe.Invoice) {
  return (
    invoice.metadata?.action === "upgrade" ||
    invoice.billing_reason === "subscription_update"
  );
}

export async function recordStripeEvent({
  event,
  headersJson,
  payloadJson,
  receiveStatus = "processed",
  signature,
  source = "stripe",
}: RecordStripeEventInput) {
  try {
    await prisma.webhookEvent.create({
      data: {
        eventType: event.type,
        eventId: event.id,
        headersJson,
        payloadJson,
        receiveStatus,
        receivedAt: new Date(),
        signature,
        source,
      },
    });

    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false;
    }

    throw error;
  }
}

export async function isStripeEventProcessed(
  eventId: string,
  source = "stripe",
) {
  const event = await prisma.webhookEvent.findUnique({
    where: {
      source_eventId: {
        eventId,
        source,
      },
    },
  });

  return Boolean(event);
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  options: SyncSubscriptionOptions = {},
) {
  const localSubscription = await findLocalSubscription(subscription, options);

  if (!localSubscription) {
    return null;
  }

  const { currentPeriodEnd, currentPeriodStart } =
    getSubscriptionPeriod(subscription);
  const platformCustomerId = stripeObjectId(subscription.customer);

  const updatedSubscription = await prisma.subscription.update({
    data: {
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: unixToDate(subscription.canceled_at),
      currentPeriodEnd,
      currentPeriodStart,
      latestPaymentAt: options.paidAt ?? undefined,
      status: subscription.status,
    },
    where: { uuid: localSubscription.uuid },
  });

  if (platformCustomerId) {
    await prisma.subscriptionPlatform.upsert({
      create: {
        platform: "stripe",
        platformCustomerId,
        platformSubscriptionId: subscription.id,
        subscriptionUuid: updatedSubscription.uuid,
      },
      update: {
        platformCustomerId,
        subscriptionUuid: updatedSubscription.uuid,
      },
      where: {
        platform_platformSubscriptionId: {
          platform: "stripe",
          platformSubscriptionId: subscription.id,
        },
      },
    });
  }

  if (subscription.status === "canceled") {
    const failedAt = new Date().toISOString();
    const pendingLogs = await prisma.subscriptionLog.findMany({
      where: {
        action: "upgrade",
        platform: "stripe",
        status: "pending",
        subscriptionUuid: updatedSubscription.uuid,
      },
    });

    await Promise.all(
      pendingLogs.map((log) =>
        prisma.subscriptionLog.update({
          data: {
            result: mergeLogResult(log.result, {
              failedAt,
              failureReason: "subscription_deleted",
            }),
            status: "failed",
          },
          where: { uuid: log.uuid },
        }),
      ),
    );
  }

  return updatedSubscription;
}

export async function markCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
) {
  const localSubscriptionId = session.metadata?.localSubscriptionId;

  if (localSubscriptionId) {
    await prisma.subscription.updateMany({
      data: { status: "incomplete_expired" },
      where: {
        status: "incomplete",
        uuid: localSubscriptionId,
      },
    });

    return;
  }

  const userUuid = session.metadata?.userId;
  const productUuid = session.metadata?.productId;

  if (!userUuid || !productUuid) {
    return;
  }

  await prisma.subscription.updateMany({
    data: { status: "incomplete_expired" },
    where: {
      productUuid,
      status: "incomplete",
      userUuid,
    },
  });
}

type UpgradeCheckoutSessionMetadata = {
  localSubscriptionId: string;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId: string;
  subscriptionChangeUuid: string;
  targetPlatformPriceId: string;
  toProductUuid: string;
};

export function getUpgradeCheckoutSessionMetadata({
  metadata,
}: Pick<Stripe.Checkout.Session, "metadata">): UpgradeCheckoutSessionMetadata | null {
  if (metadataString(metadata, "action") !== "upgrade") {
    return null;
  }

  const localSubscriptionId = metadataString(metadata, "localSubscriptionId");
  const stripeSubscriptionId = metadataString(metadata, "stripeSubscriptionId");
  const stripeSubscriptionItemId = metadataString(
    metadata,
    "stripeSubscriptionItemId",
  );
  const subscriptionChangeUuid = metadataString(
    metadata,
    "subscriptionChangeUuid",
  );
  const targetPlatformPriceId = metadataString(
    metadata,
    "targetPlatformPriceId",
  );
  const toProductUuid = metadataString(metadata, "toProductUuid");

  if (
    !localSubscriptionId ||
    !stripeSubscriptionId ||
    !stripeSubscriptionItemId ||
    !subscriptionChangeUuid ||
    !targetPlatformPriceId ||
    !toProductUuid
  ) {
    return null;
  }

  return {
    localSubscriptionId,
    stripeSubscriptionId,
    stripeSubscriptionItemId,
    subscriptionChangeUuid,
    targetPlatformPriceId,
    toProductUuid,
  };
}

export async function markUpgradeCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
) {
  const metadata = getUpgradeCheckoutSessionMetadata(session);

  if (!metadata) {
    return false;
  }

  const pendingLog = await findPendingUpgradeLogByMetadata(metadata);

  if (!pendingLog) {
    return false;
  }

  await prisma.subscriptionLog.update({
    data: {
      result: mergeLogResult(pendingLog.result, {
        checkoutSessionId: session.id,
        expiredAt: new Date().toISOString(),
        failureReason: "checkout_session_expired",
        paymentIntentId: stripeObjectId(session.payment_intent),
        stripeSubscriptionId: metadata.stripeSubscriptionId,
      }),
      status: "expired",
    },
    where: { uuid: pendingLog.uuid },
  });

  return true;
}

export async function markInvoicePaymentFailed(subscriptionId: string) {
  const platform = await prisma.subscriptionPlatform.findUnique({
    include: { subscription: true },
    where: {
      platform_platformSubscriptionId: {
        platform: "stripe",
        platformSubscriptionId: subscriptionId,
      },
    },
  });

  if (!platform) {
    return null;
  }

  return prisma.subscription.update({
    data: { status: "past_due" },
    where: { uuid: platform.subscription.uuid },
  });
}

export async function completePendingUpgradeForCheckoutSession({
  paidAt = new Date(),
  session,
}: {
  paidAt?: Date;
  session: Stripe.Checkout.Session;
}) {
  const metadata = getUpgradeCheckoutSessionMetadata(session);

  if (!metadata) {
    return false;
  }

  const pendingLog = await findPendingUpgradeLogByMetadata(metadata);

  if (!pendingLog) {
    return false;
  }

  let updatedStripeSubscription: Stripe.Subscription;

  try {
    updatedStripeSubscription = await getStripe().subscriptions.update(
      metadata.stripeSubscriptionId,
      buildSubscriptionUpgradeUpdateParams({
        itemId: metadata.stripeSubscriptionItemId,
        targetPlatformPriceId: metadata.targetPlatformPriceId,
      }),
    );
  } catch (error) {
    await prisma.subscriptionLog.update({
      data: {
        result: mergeLogResult(pendingLog.result, {
          checkoutSessionId: session.id,
          failedAt: new Date().toISOString(),
          failureReason: "subscription_update_failed",
          paymentIntentId: stripeObjectId(session.payment_intent),
          stripeSubscriptionId: metadata.stripeSubscriptionId,
        }),
        status: "upgrade_failed",
      },
      where: { uuid: pendingLog.uuid },
    });

    if (isStripeSdkError(error)) {
      return true;
    }

    throw error;
  }

  const { currentPeriodEnd, currentPeriodStart } = getSubscriptionPeriod(
    updatedStripeSubscription,
  );

  await prisma.$transaction([
    prisma.subscription.update({
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
        currentPeriodEnd,
        currentPeriodStart,
        latestPaymentAt: paidAt,
        productUuid: metadata.toProductUuid,
        status: "active",
      },
      where: { uuid: metadata.localSubscriptionId },
    }),
    prisma.subscriptionLog.update({
      data: {
        result: mergeLogResult(pendingLog.result, {
          checkoutSessionId: session.id,
          completedAt: paidAt.toISOString(),
          paymentIntentId: stripeObjectId(session.payment_intent),
          stripeSubscriptionId: metadata.stripeSubscriptionId,
        }),
        status: "completed",
      },
      where: { uuid: pendingLog.uuid },
    }),
  ]);

  return true;
}

export async function hasPendingUpgradeForStripeSubscription(
  subscriptionId: string,
) {
  return Boolean(await findPendingUpgradeLog(subscriptionId));
}

export async function completePendingUpgradeForInvoice({
  invoice,
  paidAt = new Date(),
  subscription,
}: {
  invoice: Stripe.Invoice;
  paidAt?: Date;
  subscription: Stripe.Subscription;
}) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId || !isUpgradeInvoice(invoice)) {
    return false;
  }

  const pendingLog = await findPendingUpgradeLog(subscriptionId);

  const pendingResult = jsonRecord(pendingLog?.result ?? {});
  const toProductUuid = jsonString(pendingResult.toProductUuid);

  if (!pendingLog || !toProductUuid) {
    return false;
  }

  const { currentPeriodEnd, currentPeriodStart } =
    getSubscriptionPeriod(subscription);

  await prisma.$transaction([
    prisma.subscription.update({
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
        currentPeriodEnd,
        currentPeriodStart,
        latestPaymentAt: paidAt,
        productUuid: toProductUuid,
        status: "active",
      },
      where: { uuid: pendingLog.subscriptionUuid },
    }),
    prisma.subscriptionLog.update({
      data: {
        result: mergeLogResult(pendingLog.result, {
          completedAt: paidAt.toISOString(),
          invoiceId: invoice.id,
          stripeSubscriptionId: subscriptionId,
        }),
        status: "completed",
      },
      where: { uuid: pendingLog.uuid },
    }),
  ]);

  return true;
}

export async function markPendingUpgradePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId || !isUpgradeInvoice(invoice)) {
    return false;
  }

  const pendingLog = await findPendingUpgradeLog(subscriptionId);

  if (!pendingLog) {
    return false;
  }

  await prisma.subscriptionLog.update({
    data: {
      result: mergeLogResult(pendingLog.result, {
        failedAt: new Date().toISOString(),
        failureReason: "payment_failed",
        invoiceId: invoice.id,
        stripeSubscriptionId: subscriptionId,
      }),
      status: "failed",
    },
    where: { uuid: pendingLog.uuid },
  });

  return true;
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const invoiceWithParent = invoice as Stripe.Invoice & {
    parent?: {
      subscription_details?: {
        subscription?: StripeObjectRef;
      } | null;
    } | null;
    subscription?: StripeObjectRef;
  };

  return (
    stripeObjectId(invoiceWithParent.parent?.subscription_details?.subscription) ??
    stripeObjectId(invoiceWithParent.subscription)
  );
}
