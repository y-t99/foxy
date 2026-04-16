import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";
import {
  cancelSubscriptionAtPeriodEnd,
  createCheckoutSession,
} from "@/app/actions/billing";
import { getStripeCheckoutConfigStatus } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { hasSubscriptionAccess } from "@/lib/subscription-access";

type DashboardPageProps = {
  searchParams?: Promise<{
    billing?: string;
    checkout?: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function CheckoutNotice({
  billing,
  checkout,
}: {
  billing?: string;
  checkout?: string;
}) {
  if (checkout === "success") {
    return (
      <p className="rounded-md border border-[#b7d7c2] bg-[#effaf2] px-4 py-3 text-sm text-[#1d5f37]">
        Payment received. Your access will refresh as soon as Stripe sends the
        subscription webhook.
      </p>
    );
  }

  if (checkout === "cancelled") {
    return (
      <p className="rounded-md border border-[#ecd0a6] bg-[#fff8eb] px-4 py-3 text-sm text-[#8a5a16]">
        Checkout was cancelled. You can start again whenever you are ready.
      </p>
    );
  }

  if (billing === "config") {
    return (
      <p className="rounded-md border border-[#ecd0a6] bg-[#fff8eb] px-4 py-3 text-sm text-[#8a5a16]">
        Stripe billing is not configured in this environment yet. Update your
        local `.env`, then reload the dashboard.
      </p>
    );
  }

  if (billing === "price_recurring") {
    return (
      <p className="rounded-md border border-[#ecd0a6] bg-[#fff8eb] px-4 py-3 text-sm text-[#8a5a16]">
        The configured Stripe price is not recurring. Replace
        `STRIPE_PRICE_ID` with a recurring monthly price before using
        subscription checkout.
      </p>
    );
  }

  if (billing === "price_product") {
    return (
      <p className="rounded-md border border-[#ecd0a6] bg-[#fff8eb] px-4 py-3 text-sm text-[#8a5a16]">
        The configured Stripe price does not belong to the configured product.
        Check `STRIPE_PRODUCT_ID` and `STRIPE_PRICE_ID` in `.env`.
      </p>
    );
  }

  if (billing === "stripe_api") {
    return (
      <p className="rounded-md border border-[#ecd0a6] bg-[#fff8eb] px-4 py-3 text-sm text-[#8a5a16]">
        Stripe rejected the billing request. Double-check your local Stripe key,
        product, and price configuration.
      </p>
    );
  }

  return null;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { uuid: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  const subscription = await prisma.subscription.findFirst({
    include: {
      platform: true,
      product: true,
    },
    orderBy: { updatedAt: "desc" },
    where: { userUuid: user.uuid },
  });
  const hasAccess = hasSubscriptionAccess({
    currentPeriodEnd: subscription?.currentPeriodEnd,
    status: subscription?.status,
  });
  const stripeCheckoutConfig = getStripeCheckoutConfigStatus();
  const missingStripeConfig = stripeCheckoutConfig.missing.join(", ");

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#101828]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d9dee8] pb-5">
          <Link className="text-lg font-semibold" href="/">
            foxy
          </Link>
          <form action={signOutAction}>
            <button
              className="h-10 rounded-md border border-[#d9dee8] bg-white px-4 text-sm font-semibold text-[#364152] transition hover:border-[#0f766e] hover:text-[#0f766e]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-lg border border-[#d9dee8] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase text-[#c2410c]">
              Account
            </p>
            <h1 className="mt-3 text-3xl font-semibold">{user.name}</h1>
            <p className="mt-2 text-sm text-[#667085]">{user.email}</p>
            <dl className="mt-6 grid gap-4 text-sm">
              <div>
                <dt className="font-medium text-[#667085]">Subscription</dt>
                <dd className="mt-1 font-semibold text-[#101828]">
                  {subscription?.status ?? "none"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[#667085]">Current period ends</dt>
                <dd className="mt-1 font-semibold text-[#101828]">
                  {formatDate(subscription?.currentPeriodEnd ?? null)}
                </dd>
              </div>
            </dl>
          </aside>

          <section className="grid content-start gap-5">
            <CheckoutNotice
              billing={params?.billing}
              checkout={params?.checkout}
            />
            {hasAccess ? (
              <div className="rounded-lg border border-[#d9dee8] bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase text-[#1d5f37]">
                  Active access
                </p>
                <h2 className="mt-3 text-4xl font-semibold">
                  Your paid dashboard is unlocked.
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-[#4b5565]">
                  This is the protected MVP area. Future billing features can
                  grow here without changing the subscription gate.
                </p>
                {subscription?.cancelAtPeriodEnd ? (
                  <p className="mt-6 rounded-md border border-[#ecd0a6] bg-[#fff8eb] px-4 py-3 text-sm text-[#8a5a16]">
                    Cancellation is scheduled. Access remains active until{" "}
                    {formatDate(subscription.currentPeriodEnd)}.
                  </p>
                ) : subscription?.platform && stripeCheckoutConfig.isReady ? (
                  <form action={cancelSubscriptionAtPeriodEnd} className="mt-6">
                    <button
                      className="h-11 rounded-md border border-[#d9dee8] bg-white px-4 text-sm font-semibold text-[#364152] transition hover:border-[#c2410c] hover:text-[#c2410c]"
                      type="submit"
                    >
                      Cancel at period end
                    </button>
                  </form>
                ) : subscription?.platform ? (
                  <p className="mt-6 rounded-md border border-[#ecd0a6] bg-[#fff8eb] px-4 py-3 text-sm text-[#8a5a16]">
                    Billing actions are disabled until local Stripe config is
                    updated in `.env`.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-[#d9dee8] bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase text-[#c2410c]">
                  Subscription required
                </p>
                <h2 className="mt-3 text-4xl font-semibold">
                  Subscribe to unlock the dashboard.
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-[#4b5565]">
                  Basic Plan is the only MVP plan. It grants access after Stripe
                  confirms an active subscription.
                </p>
                {stripeCheckoutConfig.isReady ? (
                  <form action={createCheckoutSession} className="mt-6">
                    <button
                      className="h-11 rounded-md bg-[#0f766e] px-5 text-sm font-semibold text-white transition hover:bg-[#115e59]"
                      type="submit"
                    >
                      Subscribe to Basic Plan
                    </button>
                  </form>
                ) : (
                  <div className="mt-6 grid gap-3">
                    <p className="rounded-md border border-[#ecd0a6] bg-[#fff8eb] px-4 py-3 text-sm text-[#8a5a16]">
                      Stripe is still using local placeholder values. Update{" "}
                      {missingStripeConfig} in `.env` to enable checkout.
                    </p>
                    <button
                      className="h-11 rounded-md bg-[#d0d5dd] px-5 text-sm font-semibold text-white"
                      disabled
                      type="button"
                    >
                      Subscribe to Basic Plan
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
