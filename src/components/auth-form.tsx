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
      className="h-11 rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-60"
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
    <form action={formAction} className="grid gap-4">
      {mode === "register" ? (
        <label className="grid gap-2 text-sm font-medium text-[#364152]">
          Name
          <input
            className="h-11 rounded-md border border-[#d9dee8] bg-white px-3 text-base text-[#101828] outline-none ring-[#0f766e] focus:ring-2"
            name="name"
            required
            type="text"
          />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-medium text-[#364152]">
        Email
        <input
          className="h-11 rounded-md border border-[#d9dee8] bg-white px-3 text-base text-[#101828] outline-none ring-[#0f766e] focus:ring-2"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#364152]">
        Password
        <input
          className="h-11 rounded-md border border-[#d9dee8] bg-white px-3 text-base text-[#101828] outline-none ring-[#0f766e] focus:ring-2"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="rounded-md border border-[#f0b4a8] bg-[#fff3f0] px-3 py-2 text-sm text-[#9c2f1c]">
          {state.error}
        </p>
      ) : null}
      <SubmitButton label={buttonLabel} />
      <p className="text-sm text-[#667085]">
        {alternateText}{" "}
        <Link className="font-semibold text-[#0f766e]" href={alternateHref}>
          {alternateLabel}
        </Link>
      </p>
    </form>
  );
}
