import { shopInventory } from "../data/shop";
import { getDb } from "../db";
import { ensureAllShopRotations } from "./shop-rotation";

const BOT_SEED_MIN = 5;

export async function settleWorld(now = new Date()) {
  const db = getDb();
  await ensureAllShopRotations(now);

  const expired = await db.auctionListing.updateMany({
    where: { status: "active", endsAt: { lte: now }, currentBidderId: null },
    data: { status: "expired" },
  });
  const sold = await db.auctionListing.updateMany({
    where: { status: "active", endsAt: { lte: now }, currentBidderId: { not: null } },
    data: { status: "sold" },
  });
  const seeded = await seedBotAuctions(now);

  await db.worldJobRun.create({
    data: {
      job: "world-tick",
      status: "ok",
      details: { expired: expired.count, sold: sold.count, seeded },
    },
  });

  return { expired: expired.count, sold: sold.count, seeded };
}

async function seedBotAuctions(now: Date) {
  const db = getDb();
  const active = await db.auctionListing.count({ where: { status: "active" } });
  if (active >= BOT_SEED_MIN) return 0;

  const rows = shopInventory
    .filter((row) => row.buyPrice <= 80)
    .slice(0, BOT_SEED_MIN - active);
  if (rows.length === 0) return 0;

  await db.auctionListing.createMany({
    data: rows.map((row, index) => ({
      sellerId: "bot_quartermaster",
      itemId: row.itemId,
      quantity: 1,
      startingBid: Math.max(1, row.sellPrice + index),
      buyoutPrice: row.buyPrice,
      status: "active",
      endsAt: new Date(now.getTime() + (2 + index) * 60 * 60_000),
    })),
  });
  return rows.length;
}
