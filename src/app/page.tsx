const starterStatus = [
  ["Framework", "Next.js App Router"],
  ["Database", "SQLite through Prisma"],
  ["Schema", "Model-free baseline"],
  ["Package manager", "pnpm"],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#171717]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d8d2c7] pb-5">
          <span className="text-lg font-semibold tracking-normal">foxy</span>
          <span className="rounded-full bg-[#1d3b34] px-3 py-1 text-sm font-medium text-white">
            Ready
          </span>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase text-[#9c4f2b]">
              Mini billing system
            </p>
            <h1 className="text-5xl font-semibold tracking-normal text-balance sm:text-6xl">
              A calm foundation for invoices, customers, and local data.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#57534e]">
              Next.js App Router is in place, Prisma is configured for SQLite,
              and the schema is intentionally empty for the first business model.
            </p>
          </div>

          <div className="grid gap-4">
            {starterStatus.map(([label, value]) => (
              <div
                className="rounded-lg border border-[#d8d2c7] bg-white px-5 py-4 shadow-sm"
                key={label}
              >
                <p className="text-sm font-medium text-[#78716c]">{label}</p>
                <p className="mt-1 text-xl font-semibold text-[#171717]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-[#d8d2c7] pt-5 text-sm text-[#78716c]">
          Local-first web app scaffold.
        </footer>
      </section>
    </main>
  );
}
