import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6 py-12 text-[#101828]">
      <section className="w-full max-w-md rounded-lg border border-[#d9dee8] bg-white p-6 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase text-[#c2410c]">
          Welcome back
        </p>
        <h1 className="text-3xl font-semibold">Log in to foxy</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Continue to your subscription dashboard.
        </p>
        <div className="mt-6">
          <AuthForm
            action={loginAction}
            alternateHref="/register"
            alternateLabel="Create one"
            alternateText="Need an account?"
            buttonLabel="Log in"
            mode="login"
          />
        </div>
      </section>
    </main>
  );
}
