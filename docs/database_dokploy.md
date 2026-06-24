# Tercio Database And Dokploy

## Production Shape

- PostgreSQL is the only required v1 service.
- Dokploy stores `DATABASE_URL` as an environment secret.
- `CRON_SECRET` protects `POST /api/cron/world-tick`; call it with
  `Authorization: Bearer <secret>` or `x-cron-secret: <secret>`.
- Image binaries stay in `GPT-ASSETS` and are copied into `web/public/assets/gpt-bank` during build/seed sync.
- Prisma migrations run with `prisma migrate deploy`; do not use `prisma db push` in production.

## Deploy Flow

1. Create a Dokploy PostgreSQL service for this project.
2. Set the app environment variable `DATABASE_URL` to the internal PostgreSQL URL.
3. Set `CRON_SECRET` and configure a periodic HTTP job to `POST /api/cron/world-tick` every 5-10 minutes.
4. Deploy with root context and `Dockerfile.dokploy`.
5. Container startup runs:

```sh
pnpm exec prisma migrate deploy && pnpm db:seed && pnpm start
```

## Local Flow

Use filesystem demo state by setting:

```env
TERCIO_DEMO_STORE="filesystem"
```

Use PostgreSQL locally by setting only `DATABASE_URL`, then run:

```sh
pnpm --dir web exec prisma migrate deploy
pnpm --dir web db:seed
```

## Backend MVP Loop

- `/api/game/state` is the current client hydration endpoint.
- `/api/demo/state` remains as a compatibility alias during the migration.
- Timed missions use `ActiveMission`: start, wait for `completesAt`, then claim the report.
- The armory reads `ShopRotation` stock and refreshes globally every 60 minutes.
- The market uses `AuctionListing` and `AuctionBid`; bot lots are seeded by world tick when the market is sparse.
