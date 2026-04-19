import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { registerAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { ShellHeader } from "@/components/shell-header";
import { StatusStrip } from "@/components/status-strip";

const registerStatusItems = [
  {
    label: "Create",
    value: "Set up your account in one pass",
  },
  {
    label: "Unlock",
    value: "Open the protected workspace next",
  },
  {
    label: "Manage",
    value: "Keep content work and results together",
  },
] as const;

export const metadata: Metadata = {
  title: "Register",
  description: "Create your foxy account and enter the calm content workspace.",
};

export default async function RegisterPage() {
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
                href="/login"
              >
                Log in
              </Link>
            </>
          }
        />

        <div className="flex flex-1 flex-col gap-8 py-10 lg:gap-10 lg:py-12">
          <section className="grid gap-10 border-b border-[var(--color-line)] pb-10 lg:grid-cols-[minmax(0,1.14fr)_minmax(320px,0.86fr)]">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-sm">
                Register
              </p>
              <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:leading-[0.94]">
                Create your account and enter the workspace.
              </h1>
              <p className="mt-4 max-w-[41rem] text-base leading-8 text-[var(--color-foreground-soft)] sm:text-[1.05rem]">
                The registration flow stays as quiet as the rest of the product:
                set up your account, unlock access, then continue into a calmer
                place to generate and manage content.
              </p>
            </div>

            <StatusStrip items={[...registerStatusItems]} />
          </section>

          <section className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.76fr)] lg:items-start">
            <div className="grid gap-8">
              <article className="max-w-[38rem] border-t border-[var(--color-line)] pt-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Start gently
                </p>
                <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--color-foreground)]">
                  Registration should feel guided, not technical.
                </h2>
                <p className="mt-3 max-w-[36ch] text-sm leading-7 text-[var(--color-foreground-soft)]">
                  New users get a short path into the product with minimal
                  friction and clearer language about what opens next.
                </p>
              </article>

              <article className="max-w-[38rem] border-t border-[var(--color-line)] pt-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Keep momentum
                </p>
                <p className="mt-3 max-w-[38ch] text-sm leading-7 text-[var(--color-foreground-soft)]">
                  Account creation, access setup, and later result management
                  all now sit inside the same visual language, so the product
                  feels coherent from the first screen.
                </p>
              </article>
            </div>

            <aside className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-7 sm:px-8 sm:py-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Start here
              </p>
              <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-foreground)]">
                Create your foxy account
              </h2>
              <p className="mt-4 max-w-[32ch] text-sm leading-7 text-[var(--color-foreground-soft)]">
                Register first, then continue into the same quiet workspace
                system used across the homepage, login flow, and dashboard.
              </p>
              <div className="mt-8">
                <AuthForm
                  action={registerAction}
                  alternateHref="/login"
                  alternateLabel="Log in"
                  alternateText="Already have an account?"
                  buttonLabel="Create account"
                  mode="register"
                />
              </div>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
