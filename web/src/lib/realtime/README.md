# lib/realtime/

Future home for the WebSocket client that talks to Django Channels.

## Status

Not implemented yet. The store is ready to receive server events
(`useGameStore.getState().applyServerEvent(event)` from
`lib/types.ts`'s `ServerEvent` union), but no client connects anywhere.

## When implementing

1. Add a `connect()` helper that opens a `WebSocket` to the Django
   Channels endpoint. Reconnect on close, back off exponentially.
2. Authenticate using a session cookie or short-lived JWT issued by
   the Django REST API (`lib/api/`).
3. On each inbound message, validate it against the `ServerEvent`
   discriminated union, then call `useGameStore.getState().applyServerEvent(event)`.
4. Outbound events (e.g. "user is typing in chat") live in
   `lib/realtime/outbound.ts` and are sent through the same socket.

## Boundaries

- This folder must NOT import from `lib/data/` (those are dev-fallback
  static data, not the realtime source of truth).
- This folder must NOT import from `lib/actions/_demo.ts` (server
  actions handle request/response; realtime is push-only).
- The store is the only consumer of inbound events; do not mutate
  `useGameStore` from inside React components in response to a
  socket message - go through `applyServerEvent`.
