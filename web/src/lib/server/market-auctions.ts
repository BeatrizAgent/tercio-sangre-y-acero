import { getItem } from "../data";
import { requireApiSession } from "../auth/session";
import { getDb } from "../db";
import { canFallbackToFilesystem, shouldUseDatabase } from "../actions/_demo";
import { fail, ok, type ActionResult } from "../domain/result";
import { ensureAuctionHouse } from "./auction-house";

export interface AuctionView {
  id: string;
  itemId: string;
  itemName: string;
  sellerId: string;
  startingBid: number;
  currentBid: number | null;
  currentBidderId: string | null;
  buyoutPrice: number | null;
  status: string;
  endsAt: string;
  isMine: boolean;
  isWinning: boolean;
  isSystem: boolean;
  currentBidderName: string | null;
  winnerClaimedAt: string | null;
  sellerClaimedAt: string | null;
}

export async function listAuctionViewsForCurrentSession(): Promise<ActionResult<{ auctions: AuctionView[] }>> {
  const session = await requireApiSession();
  if (shouldUseDatabase()) {
    try {
      const db = getDb();

      const soldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
      await ensureAuctionHouse(db, new Date());

      const rows = await db.auctionListing.findMany({
        where: {
          status: { in: ["active", "sold", "expired"] },
          OR: [
            { status: "active" },
            ...(soldier
              ? [
                  { sellerId: soldier.id, sellerClaimedAt: null },
                  { currentBidderId: soldier.id, winnerClaimedAt: null },
                ]
              : []),
          ],
        },
        orderBy: [{ status: "asc" }, { endsAt: "asc" }],
        take: 50,
      });

      const bidderIds = rows.map((row) => row.currentBidderId).filter(Boolean) as string[];
      const bidders = bidderIds.length > 0
        ? await db.soldier.findMany({
            where: { id: { in: bidderIds } },
            select: { id: true, name: true },
          })
        : [];

      return ok("Subastas cargadas.", {
        auctions: rows.map((row) => ({
          id: row.id,
          itemId: row.itemId,
          itemName: getItem(row.itemId)?.name ?? row.itemId,
          sellerId: row.sellerId,
          startingBid: row.startingBid,
          currentBid: row.currentBid,
          currentBidderId: row.currentBidderId,
          buyoutPrice: row.buyoutPrice,
          status: row.status,
          endsAt: row.endsAt.toISOString(),
          isMine: row.sellerId === soldier?.id,
          isWinning: row.currentBidderId === soldier?.id,
          isSystem: row.sellerId === "system",
          currentBidderName: row.currentBidderId
            ? bidders.find((b) => b.id === row.currentBidderId)?.name ?? "Soldado rival"
            : null,
          winnerClaimedAt: row.winnerClaimedAt ? row.winnerClaimedAt.toISOString() : null,
          sellerClaimedAt: row.sellerClaimedAt ? row.sellerClaimedAt.toISOString() : null,
        })),
      });
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
    }
  }

  return ok("Subastas cargadas (Modo Demo sin Base de Datos).", { auctions: [] });
}

export function auctionErrorResult(error: unknown): ActionResult<{ auctions: AuctionView[] }> {
  return fail(error instanceof Error ? error.message : "No se pudieron cargar las subastas.");
}
