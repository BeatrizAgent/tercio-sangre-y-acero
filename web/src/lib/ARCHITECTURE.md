# lib/ Architecture

This folder is the data and behavior layer for the web client. It is
organized so the future migration to a Django + Postgres + Channels
backend touches the smallest possible surface.

## Layers

```
   app/         components/        (consumer layer; depends on lib/)
     |              |
     v              v
   lib/stores/    lib/realtime/      (client-side state; lib/realtime/
     |             |                 is a placeholder today)
     v             v
   lib/actions/   (server actions; depends on lib/domain and lib/actions/_demo)
     |
     v
   lib/domain/   (pure business logic; no I/O)
     |
     v
   lib/data/     (static data; today JSON imports, tomorrow Django REST)

   lib/api/      (placeholder)      fetch wrapper for the REST API
   lib/cache/    (placeholder)      Redis client + per-resource TTLs
   lib/auth/     (placeholder)      session/guards/redirects
   lib/realtime/ (placeholder)      WebSocket client for Django Channels
```

## Rules

1. `lib/domain/` is pure. It may import from `lib/data/` and from
   `./inventory-grid`, but never from `lib/stores/`, `lib/actions/`,
   `lib/api/`, `lib/realtime/`, `node:fs`, or anything that performs I/O.
2. `lib/data/` is read-only. It loads JSON, exports typed lookups, and
   must never mutate. When the Django backend lands, the modules here
   are replaced one by one with API fetches; consumers keep working.
3. `lib/stores/` (Zustand) holds the entire client-side game state. It
   may import from `lib/domain/`, `lib/data/`, and `lib/realtime/`.
4. `lib/actions/` (Next.js server actions) is the request/response
   counterpart of the store. It dispatches to `lib/domain/` and
   persists via `lib/actions/_demo.ts` (today: `.demo/state.json`).
5. `lib/api/`, `lib/cache/`, `lib/auth/`, `lib/realtime/` are
   placeholders for the backend. They contain README contracts but
   no code yet.

## Domain function shape

Every action in `lib/domain/*.ts` follows the same contract:

```ts
export function someActionInState(
  state: GameState,
  ...args
): { next: GameState; result: ActionResult<...> }
```

The `state` argument is read-only; the function never mutates it. The
returned `next` is a new immutable state. The `result` is an
`ActionResult` (see `lib/domain/result.ts`) carrying the human-readable
message and any payload the caller needs (e.g. `reportId` after a
mission).

The Zustand store and the server actions both consume this shape
identically, so the same code path runs in both contexts.

## Migration to Django (future work)

1. `lib/data/*.ts` modules are replaced one by one with `lib/api/*`
   fetch wrappers. Consumers do not change because they already import
   from the data barrel.
2. `lib/actions/_demo.ts` is replaced with a `lib/api/*` client. The
   action files in `lib/actions/*` do not change.
3. `lib/realtime/*` is implemented. Inbound events are funneled into
   `useGameStore.getState().applyServerEvent(event)`.
4. `lib/cache/*` wraps static-data reads with TTL-based caching.
5. `lib/auth/*` adds session guards to server actions and pages.
