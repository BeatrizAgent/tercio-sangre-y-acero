"use server";

import { revalidatePath } from "next/cache";
import { getItem, itemDefinitions } from "../data";
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
import { loadGameState, persistGameState, persistGameStateForUser, shouldUseDatabase } from "./_demo";
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
  isSystem: boolean;
  currentBidderName: string | null;
  winnerClaimedAt: string | null;
  sellerClaimedAt: string | null;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export async function checkAndRotateSystemAuctions(db: any, now: Date) {
  // 1. Get active system auctions
  const activeSystem = await db.auctionListing.findMany({
    where: { sellerId: "system", status: "active" },
  });

  // Check if they need rotation
  // If there are no active system auctions OR the first active one has expired
  const needsRotation = activeSystem.length === 0 || activeSystem[0].endsAt <= now;

  if (needsRotation) {
    // Resolve expired system auctions
    if (activeSystem.length > 0) {
      for (const listing of activeSystem) {
        if (listing.endsAt <= now) {
          const nextStatus = listing.currentBidderId ? "sold" : "expired";
          await db.auctionListing.update({
            where: { id: listing.id },
            data: { status: nextStatus },
          });
        }
      }
    }

    // Clean up old system auctions (expired or sold & winner claimed)
    await db.auctionListing.deleteMany({
      where: {
        sellerId: "system",
        OR: [
          { status: "expired" },
          { status: "sold", winnerClaimedAt: { not: null } },
        ],
      },
    });

    // Generate new system auctions
    // Calculate the next rotation boundary (even hours: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22)
    const currentHour = now.getUTCHours();
    const nextEvenHour = currentHour + (2 - (currentHour % 2));
    const endsAt = new Date(now);
    endsAt.setUTCHours(nextEvenHour, 0, 0, 0);

    const consumables = itemDefinitions.filter((i) => i.slot === "consumable");
    const commonEquipment = itemDefinitions.filter((i) => i.slot !== "consumable" && i.rarity === "common");
    const uncommonEquipment = itemDefinitions.filter((i) => i.slot !== "consumable" && i.rarity === "uncommon");
    const rareEquipment = itemDefinitions.filter((i) => i.slot !== "consumable" && i.rarity === "rare");
    const epicEquipment = itemDefinitions.filter((i) => i.slot !== "consumable" && i.rarity === "epic");

    const pickRandom = (arr: typeof itemDefinitions[number][]) => {
      if (arr.length === 0) return null;
      return arr[Math.floor(Math.random() * arr.length)];
    };

    const selectedItems: typeof itemDefinitions[number][] = [];

    // 2 Consumables
    for (let i = 0; i < 2; i++) {
      const item = pickRandom(consumables);
      if (item) selectedItems.push(item);
    }
    // 2 Common Equipment
    for (let i = 0; i < 2; i++) {
      const item = pickRandom(commonEquipment);
      if (item) selectedItems.push(item);
    }
    // 1 Uncommon Equipment
    const uncommonItem = pickRandom(uncommonEquipment);
    if (uncommonItem) selectedItems.push(uncommonItem);
    // 1 Rare or Epic Equipment
    const rareOrEpic = Math.random() > 0.4 ? rareEquipment : epicEquipment;
    const highTierItem = pickRandom(rareOrEpic.length > 0 ? rareOrEpic : rareEquipment);
    if (highTierItem) selectedItems.push(highTierItem);

    for (const item of selectedItems) {
      const startingBid = Math.max(1, Math.round(item.value * (0.5 + Math.random() * 0.3)));
      await db.auctionListing.create({
        data: {
          id: `system_${item.id}_${now.getTime()}_${Math.random().toString(36).substr(2, 4)}`,
          sellerId: "system",
          itemId: item.id,
          quantity: 1,
          startingBid,
          currentBid: null,
          currentBidderId: null,
          buyoutPrice: null,
          status: "active",
          endsAt,
          createdAt: now,
        },
      });
    }
  } else {
    // Check if we should simulate bot bids
    await simulateBotBidsForActiveSystemAuctions(db, now, activeSystem);
  }
}

async function simulateBotBidsForActiveSystemAuctions(db: any, now: Date, activeSystem: any[]) {
  const bots = await db.soldier.findMany({
    where: { user: { isBot: true } },
    select: { id: true, name: true },
  });
  if (bots.length === 0) return;

  for (const listing of activeSystem) {
    const totalDuration = listing.endsAt.getTime() - listing.createdAt.getTime();
    const elapsed = now.getTime() - listing.createdAt.getTime();
    const elapsedPct = Math.max(0, Math.min(1, elapsed / totalDuration));

    const seed = hashCode(listing.id);
    const numBids = (seed % 3) + 1; // 1 to 3 bids scheduled

    const scheduledBids = [];
    for (let i = 0; i < numBids; i++) {
      const bidPct = 0.05 + ((seed + i * 37) % 90) / 100; // 5% to 95% of duration
      const botIdx = (seed + i * 17) % bots.length;
      
      // Calculate target bid amount
      let bidAmount = listing.startingBid;
      for (let k = 0; k <= i; k++) {
        const incrementPct = 0.05 + ((seed + k * 13) % 10) / 100; // 5% to 15%
        bidAmount += Math.max(1, Math.round(listing.startingBid * incrementPct));
      }

      scheduledBids.push({ pct: bidPct, bot: bots[botIdx], amount: bidAmount });
    }

    // Sort scheduled bids by time pct
    scheduledBids.sort((a, b) => a.pct - b.pct);

    // Find the latest bid that should have occurred up to current time
    let targetBid = null;
    for (const bid of scheduledBids) {
      if (bid.pct <= elapsedPct) {
        targetBid = bid;
      }
    }

    if (targetBid) {
      const currentVal = listing.currentBid ?? (listing.startingBid - 1);
      const isPlayerBidder = listing.currentBidderId && !bots.some((b: any) => b.id === listing.currentBidderId);
      
      let finalBidAmount = targetBid.amount;
      if (isPlayerBidder && listing.currentBid && listing.currentBid >= finalBidAmount) {
        // If the player outbid the bot's default amount, bot bids higher (competing)
        const maxBotBid = Math.round(listing.startingBid * 2.0); // max willingness to pay
        const potentialBid = listing.currentBid + Math.max(1, Math.round(listing.startingBid * 0.08));
        if (potentialBid <= maxBotBid) {
          finalBidAmount = potentialBid;
        }
      }

      if (listing.currentBidderId !== targetBid.bot.id && finalBidAmount > currentVal) {
        await db.$transaction(async (tx: any) => {
          await tx.auctionListing.update({
            where: { id: listing.id },
            data: {
              currentBid: finalBidAmount,
              currentBidderId: targetBid.bot.id,
            },
          });
          await tx.auctionBid.create({
            data: {
              listingId: listing.id,
              bidderId: targetBid.bot.id,
              amount: finalBidAmount,
            },
          });
        });
      }
    }
  }
}

export async function listAuctionsAction(): Promise<ActionResult<{ auctions: AuctionView[] }>> {
  const session = await requireApiSession();
  if (!shouldUseDatabase()) {
    return ok("Subastas cargadas (Modo Demo sin Base de Datos).", { auctions: [] });
  }
  const db = getDb();
  
  await checkAndRotateSystemAuctions(db, new Date());

  const soldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
  const rows = await db.auctionListing.findMany({
    where: { status: { in: ["active", "sold", "expired"] } },
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
        ? bidders.find((b: any) => b.id === row.currentBidderId)?.name ?? "Soldado rival"
        : null,
      winnerClaimedAt: row.winnerClaimedAt ? row.winnerClaimedAt.toISOString() : null,
      sellerClaimedAt: row.sellerClaimedAt ? row.sellerClaimedAt.toISOString() : null,
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
  if (!shouldUseDatabase()) {
    return fail("Las subastas requieren una base de datos PostgreSQL activa.");
  }
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
  if (!shouldUseDatabase()) {
    return fail("Las subastas requieren una base de datos PostgreSQL activa.");
  }
  const db = getDb();
  
  await checkAndRotateSystemAuctions(db, new Date());

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
  if (!shouldUseDatabase()) {
    return fail("Las subastas requieren una base de datos PostgreSQL activa.");
  }
  const db = getDb();
  
  await checkAndRotateSystemAuctions(db, new Date());

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
    if (!close.result.ok) return fail(close.result.message);
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
