import type { ReactNode } from "react";
import Link from "next/link";

type ShellHeaderProps = {
  actions: ReactNode;
  context?: ReactNode;
};

export function ShellHeader({ actions, context }: ShellHeaderProps) {
  return (
    <header className="border-b border-[var(--color-line)] pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-3">
          <Link
            className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
            href="/"
          >
            foxy
          </Link>

          {context ? (
            <div className="min-w-0 text-sm text-[var(--color-foreground-soft)]">
              {context}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 sm:justify-end">{actions}</div>
      </div>
    </header>
  );
}
