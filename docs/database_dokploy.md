# Tercio Database And Dokploy

## Production Shape

- PostgreSQL is the only required v1 service.
- Dokploy stores `DATABASE_URL` as an environment secret.
- Image binaries stay in `GPT-ASSETS` and are copied into `web/public/assets/gpt-bank` during build/seed sync.
- Prisma migrations run with `prisma migrate deploy`; do not use `prisma db push` in production.

## Deploy Flow

1. Create a Dokploy PostgreSQL service for this project.
2. Set the app environment variable `DATABASE_URL` to the internal PostgreSQL URL.
3. Deploy with root context and `Dockerfile.dokploy`.
4. Container startup runs:

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
