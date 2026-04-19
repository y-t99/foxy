"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthFormState } from "@/app/actions/auth";

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  buttonLabel: string;
  mode: "login" | "register";
};

const initialState: AuthFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-foreground)] px-5 py-3 text-sm font-medium text-[var(--color-surface)] transition hover:opacity-92 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

export function AuthForm({
  action,
  alternateHref,
  alternateLabel,
  alternateText,
  buttonLabel,
  mode,
}: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      {mode === "register" ? (
        <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
          Name
          <input
            autoComplete="name"
            className="h-12 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-background)] px-4 text-base text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-line-strong)]"
            name="name"
            required
            type="text"
          />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
        Email
        <input
          autoComplete="email"
          className="h-12 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-background)] px-4 text-base text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-line-strong)]"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
        Password
        <input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="h-12 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-background)] px-4 text-base text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-line-strong)]"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p
          aria-live="polite"
          className="rounded-[var(--radius-sm)] border border-[var(--color-note-border)] bg-[var(--color-note-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-note-foreground)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <SubmitButton label={buttonLabel} />
      <p className="text-sm leading-7 text-[var(--color-muted)]">
        {alternateText}{" "}
        <Link
          className="font-medium text-[var(--color-foreground)] underline-offset-4 transition hover:underline"
          href={alternateHref}
        >
          {alternateLabel}
        </Link>
      </p>
    </form>
  );
}
