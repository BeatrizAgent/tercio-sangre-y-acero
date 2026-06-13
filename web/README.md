# Tercio: Sangre y Acero Web

Web-first browser RPG MVP built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Run MVP

```bash
pnpm install
pnpm prisma:generate
pnpm dev
```

Open `http://localhost:3000/barracks`.

The MVP uses a local demo state file at `.demo/state.json` so the loop works without a configured PostgreSQL server.

## PostgreSQL / Prisma

Copy `.env.example` to `.env` and set `DATABASE_URL`.

```bash
pnpm db:push
pnpm db:seed
```

The Prisma schema is ready, but the current UI uses the demo store until the DB-backed service layer is wired in.

## MVP Loop

Barracks -> train stat -> buy item -> equip item -> choose mission -> resolve mission -> show report -> return to barracks.

## Not Included

No auth, PvP, companies/guilds, canvas, tactical combat, or open-world exploration.
