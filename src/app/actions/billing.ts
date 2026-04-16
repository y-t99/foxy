"use server";

import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { auth } from "@/auth";
import {
  getAppUrl,
  getRequiredEnv,
  getStripeCheckoutConfigStatus,
} from "@/lib/env";
import { ensureBasicProduct } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getStripeSubscriptionPriceIssue } from "@/lib/stripe-price";
import { hasSubscriptionAccess } from "@/lib/subscription-access";
import { getStripe } from "@/lib/stripe";
import { syncStripeSubscription } from "@/lib/stripe-sync";

async function getSignedInUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { uuid: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
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

export async function createCheckoutSession() {
  if (!getStripeCheckoutConfigStatus().isReady) {
    redirect("/dashboard?billing=config");
  }

  const user = await getSignedInUser();
  const stripe = getStripe();
  const configuredPriceId = getRequiredEnv("STRIPE_PRICE_ID");
  const configuredProductId = getRequiredEnv("STRIPE_PRODUCT_ID");
  let stripePrice;

  try {
    stripePrice = await stripe.prices.retrieve(configuredPriceId);
  } catch (error) {
    if (isStripeSdkError(error)) {
      redirect("/dashboard?billing=stripe_api");
    }

    throw error;
  }

  const priceIssue = getStripeSubscriptionPriceIssue({
    expectedProductId: configuredProductId,
    price: stripePrice,
  });

  if (priceIssue) {
    redirect(`/dashboard?billing=${priceIssue}`);
  }

  const product = await ensureBasicProduct();
  const existingSubscription = await prisma.subscription.findFirst({
    orderBy: { updatedAt: "desc" },
    where: {
      productUuid: product.uuid,
      userUuid: user.uuid,
    },
  });

  if (
    existingSubscription &&
    hasSubscriptionAccess({
      currentPeriodEnd: existingSubscription.currentPeriodEnd,
      status: existingSubscription.status,
    })
  ) {
    redirect("/dashboard");
  }

  const localSubscription = existingSubscription
    ? await prisma.subscription.update({
        data: {
          cancelAtPeriodEnd: false,
          canceledAt: null,
          currentPeriodEnd: null,
          currentPeriodStart: null,
          status: "incomplete",
        },
        where: { uuid: existingSubscription.uuid },
      })
    : await prisma.subscription.create({
        data: {
          productUuid: product.uuid,
          status: "incomplete",
          userUuid: user.uuid,
        },
      });

  const existingPlatform = await prisma.subscriptionPlatform.findFirst({
    orderBy: { updatedAt: "desc" },
    where: {
      platform: "stripe",
      subscription: {
        userUuid: user.uuid,
      },
    },
  });

  const appUrl = getAppUrl();
  const params: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: user.uuid,
    line_items: [{ price: configuredPriceId, quantity: 1 }],
    metadata: {
      localSubscriptionId: localSubscription.uuid,
      productId: product.uuid,
      userId: user.uuid,
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        localSubscriptionId: localSubscription.uuid,
        productId: product.uuid,
        userId: user.uuid,
      },
    },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
  };

  if (existingPlatform?.platformCustomerId) {
    params.customer = existingPlatform.platformCustomerId;
  } else {
    params.customer_email = user.email;
  }

  let session;

  try {
    session = await stripe.checkout.sessions.create(params);
  } catch (error) {
    if (isStripeSdkError(error)) {
      redirect("/dashboard?billing=stripe_api");
    }

    throw error;
  }

  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }

  redirect(session.url);
}

export async function cancelSubscriptionAtPeriodEnd() {
  if (!getStripeCheckoutConfigStatus().isReady) {
    redirect("/dashboard?billing=config");
  }

  const user = await getSignedInUser();
  const subscription = await prisma.subscription.findFirst({
    include: { platform: true },
    orderBy: { updatedAt: "desc" },
    where: {
      status: "active",
      userUuid: user.uuid,
    },
  });

  if (!subscription?.platform?.platformSubscriptionId) {
    redirect("/dashboard");
  }

  const stripeSubscription = await getStripe().subscriptions.update(
    subscription.platform.platformSubscriptionId,
    { cancel_at_period_end: true },
  );

  await syncStripeSubscription(stripeSubscription, {
    localSubscriptionId: subscription.uuid,
  });

  redirect("/dashboard");
}
