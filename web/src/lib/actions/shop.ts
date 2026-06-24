"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buyItemInState, sellItemInState } from "../domain/shop";
import { buyRotatingShopItemInState } from "../domain/shop-rotation";
import { applyMissionRewardsInState } from "../domain/missions";
import { loadGameState, persistGameState } from "./_demo";
import { fail, ok, type ActionResult } from "../domain/result";
import { getDb } from "../db";
import { ARMORY_SHOP_ID, ensureShopRotation } from "../server/shop-rotation";

export interface BuyItemArgs {
  itemId: string;
}

export async function buyItemAction({ itemId }: BuyItemArgs): Promise<ActionResult> {
  if (process.env.DATABASE_URL) {
    try {
      await ensureShopRotation(ARMORY_SHOP_ID);
      const db = getDb();
      const state = await loadGameState();
      const stock = await db.shopRotation.findUnique({
        where: { shopId_itemId: { shopId: ARMORY_SHOP_ID, itemId } },
      });
      if (!stock) return fail("El objeto no esta en venta.");
      const out = buyRotatingShopItemInState(state, stock);
      if (!out.result.ok) return out.result;
      const updated = await db.shopRotation.updateMany({
        where: { id: stock.id, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
      if (updated.count === 0) return fail("El puesto se ha quedado sin existencias.");
      await persistGameState(out.next);
      revalidatePath("/armory");
      revalidatePath("/soldier");
      return ok(out.result.message);
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const state = await loadGameState();
  const { next, result } = buyItemInState(state, itemId);
  if (!result.ok) return result;
  await persistGameState(next);
  revalidatePath("/armory");
  revalidatePath("/soldier");
  return ok(result.message);
}

export interface SellItemArgs {
  itemId: string;
}

export async function sellItemAction({ itemId }: SellItemArgs): Promise<ActionResult> {
  const state = await loadGameState();
  const { next, result } = sellItemInState(state, itemId);
  if (!result.ok) return result;
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      await db.shopRotation.updateMany({
        where: { shopId: ARMORY_SHOP_ID, itemId },
        data: { stock: { increment: 1 } },
      });
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
    }
  }
  await persistGameState(next);
  revalidatePath("/armory");
  revalidatePath("/inventory");
  revalidatePath("/soldier");
  return ok(result.message);
}

export async function refreshShopAction(): Promise<ActionResult> {
  await ensureShopRotation(ARMORY_SHOP_ID, new Date());
  revalidatePath("/armory");
  return ok("Puesto actualizado.");
}

export async function resolveMissionAction(formData: FormData) {
  const missionId = String(formData.get("missionId"));
  const state = await loadGameState();
  const { next, result } = applyMissionRewardsInState(state, missionId);
  await persistGameState(next);
  revalidatePath("/missions");
  revalidatePath("/soldier");
  if (result.data?.reportId) redirect(`/reports/${result.data.reportId}`);
}
