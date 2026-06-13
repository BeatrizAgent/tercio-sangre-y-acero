# Data Schema

## Prisma Models

The target database models are:

- `User`
- `Soldier`
- `SoldierStats`
- `ItemDefinition`
- `InventoryItem`
- `Equipment`
- `MissionDefinition`
- `MissionResult`
- `WoundDefinition`
- `ActiveWound`
- `ShopItem`
- `TrainingLog`
- `LootTable`
- `ReportFragment`

Preserve `prisma/schema.prisma` unless a task explicitly asks to change storage shape.

## Seed Data

Seed data lives in `/web/data`:

- `seed-items.ts`
- `seed-missions.ts`
- `seed-wounds.ts`
- `seed-ranks.ts`
- `seed-report-fragments.ts`

The same seed files feed the local demo store and Prisma seed script.
