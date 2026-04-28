import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getRequiredEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import {
  completePendingUpgradeForInvoice,
  completePendingUpgradeForCheckoutSession,
  getInvoiceSubscriptionId,
  hasPendingUpgradeForStripeSubscription,
  isStripeEventProcessed,
  markCheckoutSessionExpired,
  markInvoicePaymentFailed,
  markPendingUpgradePaymentFailed,
  markUpgradeCheckoutSessionExpired,
  recordStripeEvent,
  syncStripeSubscription,
} from "@/lib/stripe-sync";

export const runtime = "nodejs";

async function retrieveSubscription(subscriptionId: string) {
  return getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersJson = JSON.stringify(Object.fromEntries(req.headers.entries()));
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getRequiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (await isStripeEventProcessed(event.id)) {
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        await completePendingUpgradeForCheckoutSession({
          paidAt: new Date(),
          session,
        })
      ) {
        break;
      }

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (subscriptionId) {
        const subscription = await retrieveSubscription(subscriptionId);
        await syncStripeSubscription(subscription, {
          localSubscriptionId: session.metadata?.localSubscriptionId,
          paidAt: new Date(),
          productId: session.metadata?.productId,
          userId: session.metadata?.userId,
        });
      }

      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!(await markUpgradeCheckoutSessionExpired(session))) {
        await markCheckoutSessionExpired(session);
      }

      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      await syncStripeSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      if (!(await hasPendingUpgradeForStripeSubscription(subscription.id))) {
        await syncStripeSubscription(subscription);
      }

      break;
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        const subscription = await retrieveSubscription(subscriptionId);
        const paidAt = new Date();
        const completedUpgrade = await completePendingUpgradeForInvoice({
          invoice,
          paidAt,
          subscription,
        });

        if (!completedUpgrade) {
          await syncStripeSubscription(subscription, {
            paidAt,
          });
        } else if (subscription.cancel_at_period_end) {
          await getStripe().subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
          });
        }
      }

      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        const failedUpgrade = await markPendingUpgradePaymentFailed(invoice);

        if (!failedUpgrade) {
          const subscription = await retrieveSubscription(subscriptionId);
          await syncStripeSubscription(subscription);
          await markInvoicePaymentFailed(subscriptionId);
        }
      }

      break;
    }
    default:
      break;
  }

  await recordStripeEvent({
    event,
    headersJson,
    payloadJson: body,
    signature,
  });

  return NextResponse.json({ received: true });
}
