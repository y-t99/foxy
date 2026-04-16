import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { registerAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6 py-12 text-[#101828]">
      <section className="w-full max-w-md rounded-lg border border-[#d9dee8] bg-white p-6 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase text-[#c2410c]">
          Start here
        </p>
        <h1 className="text-3xl font-semibold">Create your foxy account</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Register first, then subscribe to unlock the dashboard.
        </p>
        <div className="mt-6">
          <AuthForm
            action={registerAction}
            alternateHref="/login"
            alternateLabel="Log in"
            alternateText="Already have an account?"
            buttonLabel="Create account"
            mode="register"
          />
        </div>
      </section>
    </main>
  );
}
