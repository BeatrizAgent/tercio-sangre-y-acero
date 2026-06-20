# lib/cache/

Future home for the Redis client and per-resource TTL policy.

## Status

Not implemented yet. The app does not cache today beyond what Next.js
and the browser provide by default.

## When implementing

1. Add a `redis.ts` server-only client. Never expose the connection
   string to the browser; only `lib/actions/*` and `lib/api/*` may
   read from Redis.
2. Add per-resource TTL policy under `lib/cache/policies/`:
   - `static.ts`   items, ranks, missions, wounds, blessings,
                   training options. TTL: 1h. Invalidate on a
                   deployment.
   - `dynamic.ts`  soldier profile, reports, notifications. TTL: 30s.
                   Invalidate on every server-action write that
                   touches the key.
3. Use a single key namespace per resource:
   `tercio:cache:soldier:{id}`, `tercio:cache:missions:list`, etc.

## Boundaries

- This folder is server-only. Any file that imports from
  `node:redis`, `ioredis`, or similar must declare
  `import "server-only"` at the top.
- This folder must NOT depend on `lib/realtime/*`. Realtime is push
  notifications; cache is request/response memoization.
- Static-data reads from `lib/data/*` may be cached indirectly by
  moving the import to a `getStaticItems()` function that wraps
  Redis when available. The API is the same; only the implementation
  changes.
