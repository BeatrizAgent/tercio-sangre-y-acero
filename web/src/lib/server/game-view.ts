import { canUseFilesystemSessionFallback, requireApiSession } from "../auth/session";
import { getDb } from "../db";
import { loadGameState } from "../actions/_demo";
import type { GameState } from "../types";
import { getShopView } from "./shop-rotation";
import { settleWorld } from "./world";

export async function loadGameViewState(): Promise<GameState> {
  try {
    await settleWorld();
    const session = await requireApiSession();
    const state = await loadGameState();
    const db = getDb();
    const soldier = await db.soldier.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        activeMission: {
          select: {
            id: true,
            missionId: true,
            startedAt: true,
            completesAt: true,
            status: true,
            resultId: true,
          },
        },
      },
    });
    const [shop, activeCount, playerListingCount, playerBidCount] = await Promise.all([
      getShopView(),
      db.auctionListing.count({ where: { status: "active" } }),
      soldier?.id
        ? db.auctionListing.count({ where: { sellerId: soldier.id, status: "active" } })
        : Promise.resolve(0),
      soldier?.id
        ? db.auctionListing.count({ where: { currentBidderId: soldier.id, status: "active" } })
        : Promise.resolve(0),
    ]);

    return {
      ...state,
      activeMission: soldier?.activeMission
        ? {
            ...soldier.activeMission,
            status: soldier.activeMission.status as "active" | "claimed" | "cancelled",
            startedAt: soldier.activeMission.startedAt.toISOString(),
            completesAt: soldier.activeMission.completesAt.toISOString(),
          }
        : null,
      shop,
      auctions: { activeCount, playerListingCount, playerBidCount },
    };
  } catch (error) {
    if (!canUseFilesystemSessionFallback()) throw error;
    return loadGameState();
  }
}
