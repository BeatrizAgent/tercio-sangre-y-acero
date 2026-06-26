import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ensureAuctionHouse, SYSTEM_AUCTION_SELLER_ID } from "../src/lib/server/auction-house";
import { buildSystemAuctionPlan, getNextSystemAuctionEnd, SYSTEM_AUCTION_COUNT, SYSTEM_AUCTION_PLAN } from "../src/lib/server/system-auction-plan";

const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

if (!process.env.DATABASE_URL && !dryRun) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const prisma = process.env.DATABASE_URL
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  : null;

async function main() {
  const now = new Date();
  const plan = buildSystemAuctionPlan(now, SYSTEM_AUCTION_COUNT).map(({ item, slotLabel }) => ({
    slot: slotLabel,
    itemId: item.id,
    name: item.name,
  }));

  if (dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      refreshHours: 2,
      recipe: SYSTEM_AUCTION_PLAN,
      nextRefreshAt: getNextSystemAuctionEnd(now).toISOString(),
      plan,
    }, null, 2));
    return;
  }

  if (!prisma) throw new Error("DATABASE_URL is required.");

  try {
    if (force) {
      await prisma.auctionListing.updateMany({
        where: { sellerId: SYSTEM_AUCTION_SELLER_ID, status: "active" },
        data: { status: "expired" },
      });
    }

    const result = await ensureAuctionHouse(prisma, now);
    const active = await prisma.auctionListing.findMany({
      where: { sellerId: SYSTEM_AUCTION_SELLER_ID, status: "active" },
      orderBy: { createdAt: "asc" },
      select: { id: true, itemId: true, startingBid: true, endsAt: true },
    });
    console.log(JSON.stringify({
      ok: true,
      force,
      refreshHours: 2,
      recipe: SYSTEM_AUCTION_PLAN,
      nextRefreshAt: getNextSystemAuctionEnd(now).toISOString(),
      result,
      activeCount: active.length,
      active,
      plan,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
