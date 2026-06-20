# lib/auth/

Future home for the session/auth layer. Today there is no auth: the
demo store uses a single global soldier ("diego_de_arce") and the
Zustand store has no concept of a user.

## Status

Not implemented yet.

## When implementing

1. Add `session.ts` with `getSession()` and `requireSession()`:
   - `getSession()` reads the session cookie (or JWT) and returns a
     `Session` object (or null if the user is anonymous).
   - `requireSession()` returns a `Session` or redirects to
     `/sign-in`. Server actions call this at the top.
2. Add `guards.ts` with role/permission helpers:
   - `isOwner(userId, resource)` for the soldier profile and
     reports.
   - `isInGuild(userId, guildId)` for the future `/company` page.
3. The Zustand store gains a `userId` field on `GameState`; the
   `applyServerEvent` arm for "guild.member.joined" consults
   `isInGuild` before applying.

## Boundaries

- This folder is server-only at the seam with cookies/JWTs. The
  shape of the `Session` type may be shared with the client, but
  secrets never are.
- This folder must NOT depend on `lib/realtime/*`. Realtime is for
  in-game events; auth gates resource access.
