// Future Prisma entry point.
//
// Not used by the current code path (the demo store writes to
// `.demo/state.json` via lib/actions/_demo.ts). This file stays so the
// data layer has somewhere obvious to look when the Django/Postgres
// backend lands.
//
// Migration sketch:
//   1. Move schema.prisma under `prisma/` (already there) and run
//      `prisma generate` + `prisma db push` against Postgres.
//   2. Replace the body of `lib/actions/_demo.ts` with calls into
//      `getDb()` (or, more likely, a thin `lib/api/*` client that
//      wraps Prisma queries).
//   3. Keep this module's singleton pattern; the PrismaClient is
//      process-wide and the env check remains the source of truth
//      for whether the demo fallback should be used instead.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

let prisma: PrismaClient | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Use the demo store or configure PostgreSQL.");
  }

  if (!prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  }

  return prisma;
}
