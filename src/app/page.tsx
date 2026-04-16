import Link from "next/link";

const starterStatus = [
  ["Framework", "Next.js App Router"],
  ["Database", "SQLite through Prisma"],
  ["Billing", "Stripe subscriptions"],
  ["Auth", "Email and password"],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#101828]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d9dee8] pb-5">
          <span className="text-lg font-semibold tracking-normal">foxy</span>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link className="text-[#4b5565] hover:text-[#0f766e]" href="/login">
              Log in
            </Link>
            <Link
              className="rounded-md bg-[#0f766e] px-3 py-2 text-white transition hover:bg-[#115e59]"
              href="/register"
            >
              Register
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase text-[#c2410c]">
              Mini billing system
            </p>
            <h1 className="text-5xl font-semibold tracking-normal text-balance sm:text-6xl">
              foxy subscription starter
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4b5565]">
              Register, subscribe through Stripe Checkout, and unlock a
              protected dashboard once the subscription becomes active.
            </p>
          </div>

          <div className="grid gap-4">
            {starterStatus.map(([label, value]) => (
              <div
                className="rounded-lg border border-[#d9dee8] bg-white px-5 py-4 shadow-sm"
                key={label}
              >
                <p className="text-sm font-medium text-[#667085]">{label}</p>
                <p className="mt-1 text-xl font-semibold text-[#101828]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-[#d9dee8] pt-5 text-sm text-[#667085]">
          Local-first web app scaffold.
        </footer>
      </section>
    </main>
  );
}
