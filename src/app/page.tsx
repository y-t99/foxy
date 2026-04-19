import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";
import { ShellHeader } from "@/components/shell-header";
import { StatusStrip } from "@/components/status-strip";
import { getHomeHeaderState } from "./home-header";
import { homeOverviewItems } from "./page-content";

const starterStatus = [
  {
    label: "Start",
    value: "Understand the product quickly",
  },
  {
    label: "Generate",
    value: "Create content in one calm flow",
  },
  {
    label: "Manage",
    value: "Review results without extra noise",
  },
] as const;

export const metadata: Metadata = {
  title: "Homepage",
  description: "Understand foxy quickly and try a calm content workspace.",
};

export default async function Home() {
  const session = await auth();
  const headerState = getHomeHeaderState(session?.user ?? null);

  return (
    <main className="min-h-[100dvh] bg-[var(--color-background)] text-[var(--color-foreground)]">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-[var(--shell-max)] flex-col px-6 py-5 sm:px-10 lg:px-12">
        <ShellHeader
          actions={
            <nav className="flex items-center gap-3 text-sm font-medium text-[var(--color-muted)]">
              {headerState.isSignedIn ? (
                <p className="hidden text-sm text-[var(--color-foreground-soft)] sm:block">
                  {headerState.identityLabel}
                </p>
              ) : null}
              <Link
                className="rounded-full px-3 py-2 transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                href={headerState.dashboardHref}
              >
                {headerState.dashboardLabel}
              </Link>
              {headerState.isSignedIn ? (
                <form action={signOutAction}>
                  <button
                    className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-[var(--color-surface)] transition hover:opacity-92 active:scale-[0.99]"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <Link
                  className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-[var(--color-surface)] transition hover:opacity-92 active:scale-[0.99]"
                  href={headerState.ctaHref}
                >
                  {headerState.ctaLabel}
                </Link>
              )}
            </nav>
          }
        />

        <div className="flex flex-1 flex-col gap-8 py-10 lg:gap-10 lg:py-12">
          <section className="grid gap-10 border-b border-[var(--color-line)] pb-10 lg:grid-cols-[minmax(0,1.14fr)_minmax(320px,0.86fr)]">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-sm">
                Homepage
              </p>
              <h1 className="mt-4 max-w-[11ch] text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-[4.4rem] lg:leading-[0.92]">
                Understand the tool fast. Start using it just as quickly.
              </h1>
              <p className="mt-4 max-w-[41rem] text-base leading-8 text-[var(--color-foreground-soft)] sm:text-[1.05rem]">
                foxy gives non-technical users a clear place to generate
                content, review outputs, and stay oriented from the first
                click. The interface stays calm, the next step stays obvious,
                and the setup language stays out of the way.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-full bg-[var(--color-foreground)] px-5 py-3 text-sm font-medium text-[var(--color-surface)] transition hover:opacity-92 active:scale-[0.99]"
                  href="/register"
                >
                  Try it now
                </Link>
                <Link
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-muted)] active:scale-[0.99]"
                  href="/login"
                >
                  Open dashboard
                </Link>
              </div>
            </div>

            <StatusStrip items={[...starterStatus]} />
          </section>

          <section className="grid flex-1 gap-14 lg:grid-cols-[minmax(0,1.22fr)_minmax(320px,0.78fr)] lg:gap-20">
            <div className="flex flex-col justify-between gap-14">
              <div className="max-w-3xl">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted)] sm:text-sm">
                  Calm content workspace
                </p>
                <p className="mt-4 max-w-[41rem] text-base leading-8 text-[var(--color-foreground-soft)] sm:text-[1.05rem]">
                  The homepage should explain the product quickly, while the
                  rest of the interface previews the calmer working style users
                  will see once they enter the dashboard.
                </p>
              </div>

              <div className="grid gap-8 border-t border-[var(--color-line)] pt-8 sm:grid-cols-2">
                {homeOverviewItems.map((item) => (
                  <article className="max-w-[32rem]" key={item.eyebrow}>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      {item.eyebrow}
                    </p>
                    <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--color-foreground)]">
                      {item.title}
                    </h2>
                    <p className="mt-3 max-w-[34ch] text-sm leading-7 text-[var(--color-foreground-soft)]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="flex h-full flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-6 sm:px-8 sm:py-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Workspace preview
                </p>
                <h2 className="mt-4 max-w-[14ch] text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-foreground)]">
                  One place to generate, review, and keep moving.
                </h2>
                <p className="mt-4 max-w-[30ch] text-sm leading-7 text-[var(--color-foreground-soft)]">
                  The workspace stays gentle on first use: clear hierarchy,
                  minimal surfaces, and enough structure to help without feeling
                  technical.
                </p>
              </div>

              <div className="mt-10 border-t border-[var(--color-line)] pt-6">
                <div className="space-y-5">
                  {starterStatus.map((item) => (
                    <div
                      className="grid gap-2 border-b border-[var(--color-line)] pb-5 last:border-b-0 last:pb-0"
                      key={item.label}
                    >
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {item.label}
                      </p>
                      <p className="max-w-[28ch] text-sm leading-7 text-[var(--color-foreground)]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </div>

        <footer className="grid gap-3 border-t border-[var(--color-line)] pt-5 text-sm text-[var(--color-muted)] sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <p>Quiet software for content work.</p>
          <p>
            Explain the tool quickly, guide the next step clearly, and keep the
            interface out of the way.
          </p>
        </footer>
      </section>
    </main>
  );
}
