import { churchInventory, shopInventory } from "../data/shop";
import { getDb } from "../db";

export const ARMORY_SHOP_ID = "company_armory";
export const CHURCH_SHOP_ID = "field_church";

const SHOP_PERIOD_MS: Record<string, number> = {
  [ARMORY_SHOP_ID]: 60 * 60_000,
  [CHURCH_SHOP_ID]: 6 * 60 * 60_000,
};

const SHOP_ROWS = {
  [ARMORY_SHOP_ID]: shopInventory,
  [CHURCH_SHOP_ID]: churchInventory,
} as const;

export async function ensureShopRotation(shopId = ARMORY_SHOP_ID, now = new Date()) {
  const db = getDb();
  const rows = SHOP_ROWS[shopId as keyof typeof SHOP_ROWS] ?? shopInventory;
  const periodMs = SHOP_PERIOD_MS[shopId] ?? SHOP_PERIOD_MS[ARMORY_SHOP_ID];
  const nextRefreshAt = new Date(now.getTime() + periodMs);

  const existing = await db.shopRotation.findMany({
    where: { shopId },
    select: { id: true, nextRefreshAt: true },
    take: 1,
  });
  const shouldRefresh = existing.length === 0 || existing.some((row) => row.nextRefreshAt <= now);
  if (!shouldRefresh) return;

  await db.$transaction(
    rows.map((row) =>
      db.shopRotation.upsert({
        where: { shopId_itemId: { shopId, itemId: row.itemId } },
        update: {
          buyPrice: row.buyPrice,
          sellPrice: row.sellPrice,
          stock: row.stock,
          maxStock: row.stock,
          refreshedAt: now,
          nextRefreshAt,
        },
        create: {
          shopId,
          itemId: row.itemId,
          buyPrice: row.buyPrice,
          sellPrice: row.sellPrice,
          stock: row.stock,
          maxStock: row.stock,
          refreshedAt: now,
          nextRefreshAt,
        },
      }),
    ),
  );
}

export async function ensureAllShopRotations(now = new Date()) {
  await ensureShopRotation(ARMORY_SHOP_ID, now);
  await ensureShopRotation(CHURCH_SHOP_ID, now);
}

export async function getShopView() {
  const db = getDb();
  await ensureAllShopRotations();
  const rows = await db.shopRotation.findMany({
    select: { shopId: true, itemId: true, stock: true, nextRefreshAt: true },
    orderBy: [{ shopId: "asc" }, { itemId: "asc" }],
  });
  const stock = Object.fromEntries(rows.map((row) => [row.itemId, row.stock]));
  return {
    armoryNextRefreshAt: rows.find((row) => row.shopId === ARMORY_SHOP_ID)?.nextRefreshAt.toISOString(),
    churchNextRefreshAt: rows.find((row) => row.shopId === CHURCH_SHOP_ID)?.nextRefreshAt.toISOString(),
    stock,
  };
}
