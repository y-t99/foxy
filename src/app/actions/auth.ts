"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type AuthFormState = {
  error?: string;
};

const authFormSchema = z.object({
  email: z.string().email("Enter a valid email.").transform((value) => value.toLowerCase()),
  name: z.string().min(1, "Enter your name.").optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = authFormSchema
    .omit({ name: true })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email or password is incorrect." };
    }

    throw error;
  }

  redirect("/dashboard");
}

export async function registerAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = authFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return { error: "An account already exists for this email." };
  }

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but automatic login failed." };
    }

    throw error;
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
