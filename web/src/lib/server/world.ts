import { getDb } from "../db";
import { ensureAuctionHouse } from "./auction-house";
import { ensureAllShopRotations } from "./shop-rotation";

export async function settleWorld(now = new Date()) {
  const db = getDb();
  await ensureAllShopRotations(now);
  const auctions = await ensureAuctionHouse(db, now);

  await db.worldJobRun.create({
    data: {
      job: "world-tick",
      status: "ok",
      details: { auctions },
    },
  });

  return auctions;
}
