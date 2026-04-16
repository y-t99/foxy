import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

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
