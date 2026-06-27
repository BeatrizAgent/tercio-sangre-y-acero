"use server";

import { revalidatePath } from "next/cache";
import { requireApiSession } from "../auth/session";
import { getDb } from "../db";
import {
  listAuctionInState,
  placeAuctionBidInState,
  type AuctionListingState,
} from "../domain/auction";
import { fail, ok, type ActionResult } from "../domain/result";
import { normalizeGameState } from "../domain/initial-state";
import { canFallbackToFilesystem, loadGameState, persistGameState, persistGameStateForUser, shouldUseDatabase } from "./_demo";
import { claimAuctionMessageForListing } from "./mailbox";
import { ensureAuctionHouse } from "../server/auction-house";
import { listAuctionViewsForCurrentSession, type AuctionView } from "../server/market-auctions";
import type { GameState } from "../types";
import type { getDb as getDbType } from "../db";

type MarketDb = ReturnType<typeof getDbType>;

export type { AuctionView };

export async function checkAndRotateSystemAuctions(db: MarketDb, now: Date) {
  return ensureAuctionHouse(db, now);
}

export async function listAuctionsAction(): Promise<ActionResult<{ auctions: AuctionView[] }>> {
  return listAuctionViewsForCurrentSession();
}

export async function createAuctionListingAction({
  itemId,
  startingBid,
  buyoutPrice,
  durationHours,
}: {
  itemId: string;
  startingBid: number;
  buyoutPrice?: number | null;
  durationHours: 2 | 8 | 24;
}): Promise<ActionResult<{ state: GameState }>> {
  const session = await requireApiSession();
  if (shouldUseDatabase()) {
    try {
      const db = getDb();
      const state = await loadGameState();
      const soldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!soldier) return fail("Soldado no encontrado.");

      const out = listAuctionInState({
        state,
        itemId,
        startingBid,
        buyoutPrice: buyoutPrice ?? null,
        now: new Date(),
        durationHours,
      });
      if (!out.result.ok) return fail(out.result.message);

      await db.auctionListing.create({
        data: {
          id: out.listing.id,
          sellerId: soldier.id,
          itemId,
          quantity: 1,
          startingBid,
          buyoutPrice: buyoutPrice ?? null,
          status: "active",
          endsAt: new Date(out.listing.endsAt),
        },
      });
      await persistGameState(out.next);
      revalidateMarketPaths();
      return ok("Lote puesto en subasta.", { state: out.next });
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
    }
  }
  return fail("Las subastas requieren una base de datos PostgreSQL activa.");
}

export async function placeAuctionBidAction({
  listingId,
  amount,
}: {
  listingId: string;
  amount: number;
}): Promise<ActionResult<{ state: GameState }>> {
  const session = await requireApiSession();
  if (shouldUseDatabase()) {
    try {
      const db = getDb();
      
      await ensureAuctionHouse(db, new Date());

      const state = await loadGameState();
      const bidderSoldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!bidderSoldier) return fail("Soldado no encontrado.");

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
      revalidateMarketPaths();
      return ok("Puja registrada.", { state: out.bidder });
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
    }
  }
  return fail("Las subastas requieren una base de datos PostgreSQL activa.");
}

export async function claimAuctionAction({ listingId }: { listingId: string }): Promise<ActionResult<{ state: GameState }>> {
  const session = await requireApiSession();
  if (shouldUseDatabase()) {
    try {
      const db = getDb();
      
      await ensureAuctionHouse(db, new Date());

      const currentSoldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!currentSoldier) return fail("Soldado no encontrado.");
      const listingRow = await db.auctionListing.findUnique({ where: { id: listingId } });
      if (!listingRow) return fail("Subasta no encontrada.");

      const now = new Date();
      await ensureAuctionHouse(db, now);
      const freshListing = await db.auctionListing.findUnique({ where: { id: listingId } });
      if (!freshListing) return fail("Subasta no encontrada.");
      if (freshListing.status === "active") return fail("La subasta aun esta activa.");

      if (freshListing.sellerId !== currentSoldier.id && freshListing.currentBidderId !== currentSoldier.id) {
        return fail("No tienes nada que reclamar en esta subasta.");
      }

      const claimed = await claimAuctionMessageForListing(listingId);
      if (!claimed.ok) return fail(claimed.message);
      revalidateMarketPaths();
      return ok(claimed.message, claimed.data);
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
    }
  }
  return fail("Las subastas requieren una base de datos PostgreSQL activa.");
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

function revalidateMarketPaths() {
  revalidatePath("/market");
  revalidatePath("/armory");
  revalidatePath("/soldier");
}
