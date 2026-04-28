import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";
import {
  cancelSubscriptionAtPeriodEnd,
  createCheckoutSession,
  createUpgradeSession,
} from "@/app/actions/billing";
import {
  dashboardDetailSections,
  dashboardRecordItems,
  dashboardSummaryItems,
} from "@/app/page-content";
import {
  getDashboardNotice,
  shouldClearCheckoutState,
} from "@/app/dashboard/notice";
import { ShellHeader } from "@/components/shell-header";
import { StatusStrip } from "@/components/status-strip";
import { getStripeCheckoutConfigStatus } from "@/lib/env";
import { SUBSCRIPTION_PRODUCTS } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { hasSubscriptionAccess } from "@/lib/subscription-access";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Generate content and manage results in a calm workspace.",
};

type DashboardPageProps = {
  searchParams?: Promise<{
    billing?: string;
    checkout?: string;
    upgrade?: string;
  }>;
};

type DashboardFlowItem = {
  description: string;
  label: string;
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

  if (
    shouldClearCheckoutState({
      checkout: params?.checkout,
      hasAccess,
    })
  ) {
    redirect("/dashboard");
  }

  const notice = getDashboardNotice({
    billing: params?.billing,
    checkout: params?.checkout,
    hasAccess,
    upgrade: params?.upgrade,
  });
  const stripeCheckoutConfig = getStripeCheckoutConfigStatus();
  const missingStripeConfig = stripeCheckoutConfig.missing.join(", ");
  const userName = user.name?.trim() || "Your workspace";
  const userIdentity =
    user.email ?? user.name?.trim() ?? "Signed in to your workspace";
  const summaryValues = dashboardSummaryItems.map((item) => {
    if (item.label === "Access") {
      return {
        ...item,
        value: hasAccess ? "Active access" : "Subscription required",
      };
    }

    if (item.label === "Billing state") {
      return {
        ...item,
        value: subscription?.cancelAtPeriodEnd
          ? "Cancels at period close"
          : (subscription?.status ?? "Not started"),
      };
    }

    return {
      ...item,
      value: formatDate(subscription?.currentPeriodEnd ?? null),
    };
  });
  const recordValues = dashboardRecordItems.map((item) => {
    if (item.label === "Account email") {
      return {
        ...item,
        value: user.email,
      };
    }

    if (item.label === "Platform") {
      return {
        ...item,
        value: subscription?.platform?.platform ?? "Stripe not connected",
      };
    }

    return {
      ...item,
      value: subscription?.product
        ? `${subscription.product.name} · ${subscription.product.price}`
        : "No plan started",
    };
  });
  const currentProductConfig = subscription?.product
    ? SUBSCRIPTION_PRODUCTS.find(
        (product) => product.name === subscription.product.name,
      )
    : null;
  const currentProductLevel =
    currentProductConfig?.level ?? subscription?.product.level ?? 0;
  const upgradeProducts =
    hasAccess && subscription
      ? SUBSCRIPTION_PRODUCTS.filter(
          (product) => product.level > currentProductLevel,
        )
      : [];
  const generationFlow: DashboardFlowItem[] = hasAccess
    ? [
        {
          description:
            "Use this protected area as the main place to generate new content without switching into a busier tool surface.",
          label: "Ready to create",
        },
        {
          description:
            "Keep recent output, access state, and account context close enough to review without losing your place.",
          label: "Review in one place",
        },
        {
          description:
            "Billing stays visible but secondary, so the workspace still feels calm while you keep moving.",
          label: "Stay oriented",
        },
      ]
    : [
        {
          description:
            "Start the recurring plan once to open the protected work area for content generation.",
          label: "Unlock the workspace",
        },
        {
          description:
            "After Stripe confirms the subscription, the dashboard becomes the main place to work and review results.",
          label: "Enter with context",
        },
        {
          description:
            "The structure keeps account details nearby without forcing non-technical users to think like admins.",
          label: "Keep it readable",
        },
      ];
  const noteToneClass = {
    caution:
      "border-[color:var(--color-note-border)] bg-[var(--color-note-bg)] text-[var(--color-note-foreground)]",
    success:
      "border-[color:var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]",
  } as const;

  return (
    <main className="min-h-[100dvh] bg-[var(--color-background)] text-[var(--color-foreground)]">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-[var(--shell-max)] flex-col px-6 py-5 sm:px-10 lg:px-12">
        <ShellHeader
          context={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Signed in
              </p>
              <p className="min-w-0 text-sm text-[var(--color-foreground-soft)]">
                {userIdentity}
              </p>
            </div>
          }
          actions={
            <form action={signOutAction}>
              <button
                className="rounded-full px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)] active:scale-[0.99]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          }
        />

        <div className="flex flex-1 flex-col gap-8 py-8 lg:gap-10 lg:py-10">
          <section className="grid gap-8 border-b border-[var(--color-line)] pb-8 lg:grid-cols-[minmax(0,1.14fr)_minmax(320px,0.86fr)] lg:gap-10">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-sm">
                Dashboard
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
                {userName}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-foreground-soft)] sm:text-[1.05rem]">
                {hasAccess
                  ? "Access is active. This workspace is ready to hold content generation, result review, and the few supporting details you still need."
                  : "Finish the access step once, then use this space to generate content and manage results without a noisy admin-style layout."}
              </p>
            </div>

            <StatusStrip items={summaryValues} />
          </section>

          {notice ? (
            <section
              className={`rounded-[var(--radius-md)] border px-5 py-4 text-sm leading-7 ${noteToneClass[notice.tone]}`}
            >
              {notice.text}
            </section>
          ) : null}

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.16fr)_minmax(300px,0.84fr)] lg:items-start">
            <article className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-7 sm:px-8 sm:py-8">
              <p
                className={`text-xs font-medium uppercase tracking-[0.2em] sm:text-sm ${
                  hasAccess ? "text-[var(--color-success)]" : "text-[var(--color-muted)]"
                }`}
              >
                {hasAccess ? "Workspace ready" : "Access setup"}
              </p>
              <h2 className="mt-4 max-w-[14ch] text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
                {hasAccess
                  ? "The workspace is ready for content generation."
                  : "Unlock the workspace before content generation begins."}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--color-foreground-soft)] sm:text-base">
                {hasAccess
                  ? "Keep the main work surface focused on creation and review. Subscription state remains available, but it no longer takes over the page."
                  : "Start the recurring plan once and this protected area becomes the main place to work, review output, and keep the account context nearby."}
              </p>

              {hasAccess ? (
                <div className="mt-8 grid gap-3">
                  {subscription?.cancelAtPeriodEnd ? (
                    <p className="rounded-[var(--radius-md)] border border-[var(--color-note-border)] bg-[var(--color-note-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-note-foreground)]">
                      Cancellation is scheduled. Access remains active until{" "}
                      {formatDate(subscription.currentPeriodEnd ?? null)}.
                    </p>
                  ) : null}

                  {upgradeProducts.length > 0 && stripeCheckoutConfig.isReady
                    ? upgradeProducts.map((product) => {
                        const upgradeAction = createUpgradeSession.bind(
                          null,
                          product.key,
                        );

                        return (
                          <form action={upgradeAction} key={product.key}>
                            <button
                              className="flex min-h-20 w-full flex-col items-start justify-between rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 text-left transition hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-muted)] active:scale-[0.99]"
                              type="submit"
                            >
                              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                                Upgrade to {product.name}
                              </span>
                              <span className="text-sm text-[var(--color-muted)]">
                                {product.price}
                              </span>
                            </button>
                          </form>
                        );
                      })
                    : null}

                  {!subscription?.cancelAtPeriodEnd &&
                  subscription?.platform &&
                  stripeCheckoutConfig.isReady ? (
                    <form action={cancelSubscriptionAtPeriodEnd}>
                      <button
                        className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-muted)] active:scale-[0.99]"
                        type="submit"
                      >
                        Cancel at period end
                      </button>
                    </form>
                  ) : subscription?.platform && !stripeCheckoutConfig.isReady ? (
                    <p className="rounded-[var(--radius-md)] border border-[var(--color-note-border)] bg-[var(--color-note-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-note-foreground)]">
                      Billing actions stay disabled until local Stripe config is
                      updated in `.env`.
                    </p>
                  ) : null}
                </div>
              ) : stripeCheckoutConfig.isReady ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {SUBSCRIPTION_PRODUCTS.map((product) => {
                    const checkoutAction = createCheckoutSession.bind(
                      null,
                      product.key,
                    );

                    return (
                      <form action={checkoutAction} key={product.key}>
                        <button
                          className="flex min-h-24 w-full flex-col items-start justify-between rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 text-left transition hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-muted)] active:scale-[0.99]"
                          type="submit"
                        >
                          <span className="text-sm font-semibold text-[var(--color-foreground)]">
                            {product.name}
                          </span>
                          <span className="text-sm text-[var(--color-muted)]">
                            {product.price}
                          </span>
                        </button>
                      </form>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 grid gap-3">
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-note-border)] bg-[var(--color-note-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-note-foreground)]">
                    Stripe is still using local placeholder values. Update{" "}
                    {missingStripeConfig} in `.env` to enable checkout.
                  </p>
                  <button
                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-medium text-[var(--color-muted)]"
                    disabled
                    type="button"
                  >
                    Unlock the workspace
                  </button>
                </div>
              )}

              <section className="mt-10 border-t border-[var(--color-line)] pt-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {dashboardDetailSections[0]}
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  {generationFlow.map((item) => (
                    <article
                      className="border-t border-[var(--color-line)] pt-4"
                      key={item.label}
                    >
                      <h3 className="text-sm font-medium text-[var(--color-foreground)]">
                        {item.label}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-foreground-soft)]">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </article>

            <aside className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-6">
              <section>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {dashboardDetailSections[1]}
                </p>
                <dl className="mt-5 space-y-5">
                  {recordValues.map((item) => (
                    <div
                      className="border-b border-[var(--color-line)] pb-5 last:border-b-0 last:pb-0"
                      key={item.label}
                    >
                      <dt className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {item.label}
                      </dt>
                      <dd className="mt-2 text-sm leading-7 text-[var(--color-foreground)]">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="mt-8 border-t border-[var(--color-line)] pt-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Billing notes
                </p>
                <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--color-foreground-soft)]">
                  <p>
                    Checkout and cancellation stay tied to the current
                    subscription record, but they stay visually secondary to the
                    workspace itself.
                  </p>
                  <p>
                    Latest payment:{" "}
                    <span className="font-medium text-[var(--color-foreground)]">
                      {formatDate(subscription?.latestPaymentAt ?? null)}
                    </span>
                  </p>
                  <p>
                    Cancellation mode:{" "}
                    <span className="font-medium text-[var(--color-foreground)]">
                      {subscription?.cancelAtPeriodEnd
                        ? "Scheduled at period close"
                        : "No cancellation scheduled"}
                    </span>
                  </p>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
