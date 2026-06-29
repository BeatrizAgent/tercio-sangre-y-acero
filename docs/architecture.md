# Architecture

## Web Client

The main client lives in `/web` and uses Next.js App Router, React, TypeScript, and Tailwind CSS.

Routes live under `/web/src/app`. Shared services live under `/web/src/lib`. Shared components live under `/web/src/components`.

## Persistence

Prisma/PostgreSQL is the target persistence layer. The Prisma schema lives in `/web/prisma/schema.prisma`, and seed content lives in `/web/data`.

## Services

Core service modules:

- `soldier.ts`
- `inventory.ts`
- `equipment.ts`
- `shop.ts`
- `training.ts`
- `missions.ts`
- `resolver.ts`
- `reports.ts`
- `wounds.ts`

Server actions live in `actions.ts` and revalidate App Router pages after mutations.

## Canvas

Canvas is optional later. It should be isolated under `/components/canvas` and must not replace the core HTML UI.
