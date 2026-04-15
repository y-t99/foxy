# foxy

Next.js App Router foundation for a mini billing system, with Prisma configured
for local SQLite.

## Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- SQLite
- pnpm

## Development

Install dependencies:

```bash
pnpm install
```

Generate the Prisma client:

```bash
pnpm db:generate
```

Start the development server:

```bash
pnpm dev
```

Open http://localhost:3000.

## Prisma

Prisma is configured for SQLite through `DATABASE_URL` in `.env`.

The schema is intentionally model-free. Add your models to
`prisma/schema.prisma`, then create the first migration with:

```bash
pnpm db:migrate --name init
```

Useful commands:

```bash
pnpm prisma validate
pnpm db:generate
pnpm db:studio
```
