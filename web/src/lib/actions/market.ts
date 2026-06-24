"use server";

import { revalidatePath } from "next/cache";
import { getItem } from "../data";
import { requireApiSession } from "../auth/session";
import { getDb } from "../db";
import {
  closeAuctionInState,
  listAuctionInState,
  placeAuctionBidInState,
  type AuctionListingState,
} from "../domain/auction";
import { fail, ok, type ActionResult } from "../domain/result";
import { normalizeGameState } from "../domain/initial-state";
import { loadGameState, persistGameState, persistGameStateForUser } from "./_demo";
import type { GameState } from "../types";

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
}

export async function listAuctionsAction(): Promise<ActionResult<{ auctions: AuctionView[] }>> {
  const session = await requireApiSession();
  const db = getDb();
  const soldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
  const rows = await db.auctionListing.findMany({
    where: { status: { in: ["active", "sold", "expired"] } },
    orderBy: [{ status: "asc" }, { endsAt: "asc" }],
    take: 50,
  });
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
    })),
  });
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
}

export async function placeAuctionBidAction({
  listingId,
  amount,
}: {
  listingId: string;
  amount: number;
}): Promise<ActionResult<{ state: GameState }>> {
  const session = await requireApiSession();
  const db = getDb();
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
}

export async function claimAuctionAction({ listingId }: { listingId: string }): Promise<ActionResult<{ state: GameState }>> {
  const session = await requireApiSession();
  const db = getDb();
  const state = await loadGameState();
  const currentSoldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!currentSoldier) return fail("Soldado no encontrado.");
  const listingRow = await db.auctionListing.findUnique({ where: { id: listingId } });
  if (!listingRow) return fail("Subasta no encontrada.");

  const now = new Date();
  if (listingRow.status === "active" && listingRow.endsAt <= now) {
    await db.auctionListing.update({
      where: { id: listingId },
      data: { status: listingRow.currentBidderId ? "sold" : "expired" },
    });
    listingRow.status = listingRow.currentBidderId ? "sold" : "expired";
  }

  let next = state;
  if (listingRow.sellerId === currentSoldier.id) {
    if (listingRow.sellerClaimedAt) return fail("Ya has cobrado este lote.");
    if (listingRow.status === "active") return fail("La subasta aun esta activa.");
    const close = closeAuctionInState({
      listing: rowToListingState(listingRow),
      seller: { ...state, soldier: { ...state.soldier, id: currentSoldier.id } },
      winner: null,
      now,
    });
    if (listingRow.status === "sold" && listingRow.currentBid) {
      next = close.seller ?? state;
    } else if (listingRow.status === "expired") {
      next = close.seller ?? state;
    }
    await db.auctionListing.update({ where: { id: listingId }, data: { sellerClaimedAt: now } });
  } else if (listingRow.currentBidderId === currentSoldier.id) {
    if (listingRow.winnerClaimedAt) return fail("Ya has recogido este lote.");
    if (listingRow.status === "active") return fail("La subasta aun esta activa.");
    const close = closeAuctionInState({
      listing: rowToListingState(listingRow),
      seller: null,
      winner: { ...state, soldier: { ...state.soldier, id: currentSoldier.id } },
      now,
    });
    next = close.winner ?? state;
    await db.auctionListing.update({ where: { id: listingId }, data: { winnerClaimedAt: now } });
  } else {
    return fail("No tienes nada que reclamar en esta subasta.");
  }

  await persistGameState(next);
  revalidateMarketPaths();
  return ok("Subasta reclamada.", { state: next });
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
