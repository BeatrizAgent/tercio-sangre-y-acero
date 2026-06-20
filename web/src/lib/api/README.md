# lib/api/

Future home for the fetch wrapper that talks to the Django REST API.

## Status

Not implemented yet. Today the app reads static data from
`lib/data/*.ts` (synchronous JSON imports) and persists state through
`lib/actions/_demo.ts` (file-based demo store).

## When implementing

1. Add a `client.ts` with a `fetch` wrapper that:
   - reads the session cookie (or short-lived JWT) from
     `lib/auth/`
   - retries idempotent requests with exponential backoff
   - surfaces a typed `ApiError` for non-2xx responses
   - returns parsed JSON or throws
2. Add per-resource endpoint modules under `lib/api/endpoints/`:
   - `soldier.ts`        current profile + stats
   - `inventory.ts`      inventory + equipment
   - `missions.ts`       mission list + apply
   - `reports.ts`        report fetch
   - `recruitment.ts`    candidate list + recruit
   - `arena.ts`          opponent list + fight
   - etc.
3. The data layer migrates module by module: `lib/data/items.ts`
   becomes a thin wrapper around `lib/api/endpoints/items.ts`. Other
   consumers do not change because they keep importing from
   `lib/data`.

## Boundaries

- This folder must NOT import from `lib/data/*` (it replaces it).
- This folder must NOT import from `lib/realtime/*` (REST is request/
  response; Channels is push-only).
- Server-side calls live in `lib/actions/*` and call this client.
- Client-side reads (when needed) call this client from a `useEffect`
  or a `react-query`/`swr` hook; this folder does not depend on
  React.
