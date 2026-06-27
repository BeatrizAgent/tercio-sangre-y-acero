import { getDb } from "../db";
import { placeAuctionBidInState, type AuctionListingState } from "../domain/auction";
import { normalizeGameState } from "../domain/initial-state";
import { fail, ok, type ActionResult } from "../domain/result";
import type { GameState } from "../types";
import { canFallbackToFilesystem, loadGameState, persistGameState, persistGameStateForUser, shouldUseDatabase } from "../actions/_demo";
import { requireApiSession } from "../auth/session";
import { ensureAuctionHouse } from "./auction-house";

export async function placeAuctionBidForCurrentSession({
  listingId,
  amount,
}: {
  listingId: string;
  amount: number;
}): Promise<ActionResult<{ state: GameState }>> {
  const session = await requireApiSession();
  if (!shouldUseDatabase()) {
    return fail("Las subastas requieren una base de datos PostgreSQL activa.");
  }

  if (!listingId || !Number.isFinite(amount) || amount < 1) {
    return fail("Puja invalida.");
  }

  try {
    const db = getDb();
    const state = await loadGameState();
    const bidderSoldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!bidderSoldier) return fail("Soldado no encontrado.");

    const firstListingRow = await db.auctionListing.findUnique({ where: { id: listingId } });
    if (!firstListingRow) return fail("Subasta no encontrada.");

    const early = validateBidBeforeSideEffects({
      listing: rowToListingState(firstListingRow),
      bidderSoldierId: bidderSoldier.id,
      coins: state.soldier.coins,
      amount,
      now: new Date(),
    });
    if (!early.ok) return fail(early.message);

    await ensureAuctionHouse(db, new Date());

    const listingRow = await db.auctionListing.findUnique({ where: { id: listingId } });
    if (!listingRow) return fail("Subasta no encontrada.");

    const previous = listingRow.currentBidderId
      ? await loadStateBySoldierId(listingRow.currentBidderId)
      : null;

    const out = placeAuctionBidInState({
      listing: rowToListingState(listingRow),
      bidder: { ...state, soldier: { ...state.soldier, id: bidderSoldier.id } },
      previousBidder: previous?.state ?? null,
      amount,
      now: new Date(),
    });
    if (!out.result.ok) return fail(out.result.message);

    await db.$transaction(async (tx) => {
      await tx.auctionListing.update({
        where: { id: listingId },
        data: {
          currentBid: out.listing.currentBid,
          currentBidderId: out.listing.currentBidderId,
          status: out.listing.status,
        },
      });
      await tx.auctionBid.create({ data: { listingId, bidderId: bidderSoldier.id, amount } });
    });

    await persistGameState(out.bidder);
    if (previous && out.previousBidder) {
      await persistGameStateForUser(previous.userId, normalizeGameState(out.previousBidder));
    }

    return ok("Puja registrada.", { state: out.bidder });
  } catch (error) {
    if (canFallbackToFilesystem()) {
      return fail("Las subastas requieren una base de datos PostgreSQL activa.");
    }
    return bidErrorResult(error);
  }
}

export function bidErrorResult(error: unknown): ActionResult<{ state: GameState }> {
  if (error instanceof Error && error.message.trim()) {
    return fail(error.message);
  }
  return fail("La lonja no pudo registrar la puja.");
}

function validateBidBeforeSideEffects({
  listing,
  bidderSoldierId,
  coins,
  amount,
  now,
}: {
  listing: AuctionListingState;
  bidderSoldierId: string;
  coins: number;
  amount: number;
  now: Date;
}): ActionResult {
  if (listing.status !== "active") return fail("La subasta no esta activa.");
  if (new Date(listing.endsAt).getTime() <= now.getTime()) return fail("La subasta ya ha terminado.");
  if (bidderSoldierId === listing.sellerId) return fail("No puedes pujar por tu propio lote.");
  const minimum = (listing.currentBid ?? listing.startingBid - 1) + 1;
  if (amount < minimum) return fail(`La puja minima es ${minimum}.`);
  if (coins < amount) return fail("Doblones insuficientes.");
  return ok("Puja validada.");
}

function rowToListingState(row: {
  id: string;
  sellerId: string;
  itemId: string;
  quantity: number;
  startingBid: number;
  currentBid: number | null;
  currentBidderId: string | null;
  buyoutPrice: number | null;
  status: string;
  endsAt: Date;
}): AuctionListingState {
  return {
    id: row.id,
    sellerId: row.sellerId,
    itemId: row.itemId,
    quantity: row.quantity,
    startingBid: row.startingBid,
    currentBid: row.currentBid,
    currentBidderId: row.currentBidderId,
    buyoutPrice: row.buyoutPrice,
    status: row.status as AuctionListingState["status"],
    endsAt: row.endsAt.toISOString(),
  };
}

async function loadStateBySoldierId(soldierId: string): Promise<{ userId: string; state: GameState } | null> {
  const db = getDb();
  const soldier = await db.soldier.findUnique({
    where: { id: soldierId },
    select: { userId: true, user: { select: { gameSave: true } } },
  });
  if (!soldier?.user.gameSave?.state) return null;
  return {
    userId: soldier.userId,
    state: normalizeGameState(soldier.user.gameSave.state as unknown as GameState),
  };
}
