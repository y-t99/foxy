import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { ShellHeader } from "@/components/shell-header";
import { StatusStrip } from "@/components/status-strip";

const loginStatusItems = [
  {
    label: "Return",
    value: "Pick up where you left off",
  },
  {
    label: "Generate",
    value: "Open the content workspace again",
  },
  {
    label: "Manage",
    value: "Review outputs in one calm flow",
  },
] as const;

export const metadata: Metadata = {
  title: "Log In",
  description: "Return to foxy and continue in your calm content workspace.",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--color-background)] text-[var(--color-foreground)]">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-[var(--shell-max)] flex-col px-6 py-5 sm:px-10 lg:px-12">
        <ShellHeader
          actions={
            <>
              <Link
                className="rounded-full px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                href="/"
              >
                Home
              </Link>
              <Link
                className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-sm font-medium text-[var(--color-surface)] transition hover:opacity-92 active:scale-[0.99]"
                href="/register"
              >
                Create account
              </Link>
            </>
          }
        />

        <div className="flex flex-1 flex-col gap-8 py-10 lg:gap-10 lg:py-12">
          <section className="grid gap-10 border-b border-[var(--color-line)] pb-10 lg:grid-cols-[minmax(0,1.14fr)_minmax(320px,0.86fr)]">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-sm">
                Login
              </p>
              <h1 className="mt-4 max-w-[11ch] text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:leading-[0.94]">
                Return to your quiet workspace.
              </h1>
              <p className="mt-4 max-w-[41rem] text-base leading-8 text-[var(--color-foreground-soft)] sm:text-[1.05rem]">
                Use your email and password to continue generating content,
                reviewing results, and moving through the product without a busy
                account screen getting in the way.
              </p>
            </div>

            <StatusStrip items={[...loginStatusItems]} />
          </section>

          <section className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.76fr)] lg:items-start">
            <div className="grid gap-8">
              <article className="max-w-[38rem] border-t border-[var(--color-line)] pt-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  What happens next
                </p>
                <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--color-foreground)]">
                  Login should feel like a return, not a reset.
                </h2>
                <p className="mt-3 max-w-[36ch] text-sm leading-7 text-[var(--color-foreground-soft)]">
                  The page keeps just enough guidance to orient users, then gets
                  out of the way so they can continue into the dashboard.
                </p>
              </article>

              <article className="max-w-[38rem] border-t border-[var(--color-line)] pt-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Keep it simple
                </p>
                <p className="mt-3 max-w-[38ch] text-sm leading-7 text-[var(--color-foreground-soft)]">
                  Email and password stay front and center. Supporting actions
                  are still easy to find, but they no longer compete with the
                  main task.
                </p>
              </article>
            </div>

            <aside className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-7 sm:px-8 sm:py-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Welcome back
              </p>
              <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-foreground)]">
                Log in to foxy
              </h2>
              <p className="mt-4 max-w-[32ch] text-sm leading-7 text-[var(--color-foreground-soft)]">
                Continue to your dashboard and recent results without leaving the
                calm visual language of the rest of the product.
              </p>
              <div className="mt-8">
                <AuthForm
                  action={loginAction}
                  alternateHref="/register"
                  alternateLabel="Create one"
                  alternateText="Need an account?"
                  buttonLabel="Log in"
                  mode="login"
                />
              </div>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
