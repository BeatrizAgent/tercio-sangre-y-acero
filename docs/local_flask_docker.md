# Local Docker + Flask Backend

This local stack is for migrating backend behavior toward typed Flask without changing Dokploy production startup.

## Start

```powershell
docker compose -f docker-compose.local.yml up --build
```

Services:

- Next.js web: http://localhost:3000
- Flask backend: http://localhost:5000/health
- PostgreSQL: localhost:5432

If port 3000 is busy:

```powershell
$env:TERCIO_WEB_PORT="3010"; docker compose -f docker-compose.local.yml up --build
```

## Validate

```powershell
docker compose -f docker-compose.local.yml config
docker compose -f docker-compose.local.yml exec backend pytest
pnpm --dir web validate
```

## API Bridge

Set `TERCIO_FLASK_PROXY_TARGET` for the Next.js dev server to proxy:

```text
/api/flask/:path* -> <TERCIO_FLASK_PROXY_TARGET>/api/:path*
```

Current Flask endpoints:

- `GET /health`
- `GET /api/health`
- `GET /api/catalog`
- `GET /api/character-names`

Prisma remains the schema owner for now. Flask receives `DATABASE_URL`, but this first phase reads JSON catalog data only.
