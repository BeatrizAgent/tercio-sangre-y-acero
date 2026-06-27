import { getItem } from "../data/items";
import { Prisma } from "@/generated/prisma/client";
import { normalizeGameState } from "../domain/initial-state";
import type { GameState } from "../types";
import type { getDb } from "../db";
import {
  buildSystemAuctionPlan,
  getNextSystemAuctionEnd,
  systemAuctionStartingBid,
  SYSTEM_AUCTION_COUNT,
} from "./system-auction-plan";

type AuctionHouseDb = ReturnType<typeof getDb>;
type AuctionListingRow = Awaited<ReturnType<AuctionHouseDb["auctionListing"]["findMany"]>>[number];
type BotSoldierRow = { id: string; name: string };
type AuctionTx = Parameters<Parameters<AuctionHouseDb["$transaction"]>[0]>[0];

export const SYSTEM_AUCTION_SELLER_ID = "system";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export async function ensureAuctionHouse(db: AuctionHouseDb, now = new Date()) {
  const settled = await settleExpiredAuctions(db, now);
  const reconciledMessages = await ensureAuctionMessagesForClosedListings(db, now);
  const seeded = await ensureSystemAuctions(db, now);
  const botBids = await simulateBotBidsForActiveSystemAuctions(db, now);
  return { ...settled, reconciledMessages, seeded, botBids };
}

export async function settleExpiredAuctions(db: AuctionHouseDb, now = new Date()) {
  const expiredListings = await db.auctionListing.findMany({
    where: { status: "active", endsAt: { lte: now } },
  });

  let expired = 0;
  let sold = 0;
  let messages = 0;

  for (const listing of expiredListings) {
    const status = listing.currentBidderId ? "sold" : "expired";
    await db.auctionListing.update({
      where: { id: listing.id },
      data: { status },
    });
    if (status === "sold") sold += 1;
    else expired += 1;
    messages += await createAuctionMessages(db, { ...listing, status }, now);
  }

  return { expired, sold, messages };
}

export async function ensureAuctionMessagesForClosedListings(db: AuctionHouseDb, now = new Date()) {
  const closed = await db.auctionListing.findMany({
    where: {
      status: { in: ["sold", "expired"] },
      OR: [{ winnerClaimedAt: null }, { sellerClaimedAt: null }],
    },
    take: 100,
  });

  let messages = 0;
  for (const listing of closed) {
    messages += await createAuctionMessages(db, listing, now);
  }
  return messages;
}

export async function ensureSystemAuctions(db: AuctionHouseDb, now = new Date()) {
  const activeSystem = await db.auctionListing.count({
    where: { sellerId: SYSTEM_AUCTION_SELLER_ID, status: "active" },
  });
  if (activeSystem >= SYSTEM_AUCTION_COUNT) return 0;

  const endsAt = getNextSystemAuctionEnd(now);
  const items = pickSystemAuctionItems(now, SYSTEM_AUCTION_COUNT - activeSystem);
  if (items.length === 0) return 0;

  await db.auctionListing.createMany({
    data: items.map(({ item, slotId }, index) => {
      return {
        id: `system_${slotId}_${item.id}_${now.getTime()}_${index}`,
        sellerId: SYSTEM_AUCTION_SELLER_ID,
        itemId: item.id,
        quantity: 1,
        startingBid: systemAuctionStartingBid(item, now, index),
        currentBid: null,
        currentBidderId: null,
        buyoutPrice: null,
        status: "active",
        endsAt,
        createdAt: now,
      };
    }),
  });

  return items.length;
}

export async function simulateBotBidsForActiveSystemAuctions(db: AuctionHouseDb, now = new Date()) {
  const activeSystem = await db.auctionListing.findMany({
    where: { sellerId: SYSTEM_AUCTION_SELLER_ID, status: "active" },
  });
  if (activeSystem.length === 0) return 0;

  const bots = await db.soldier.findMany({
    where: { user: { isBot: true } },
    select: { id: true, name: true },
  });
  if (bots.length === 0) return 0;

  let created = 0;
  for (const listing of activeSystem) {
    const totalDuration = Math.max(1, listing.endsAt.getTime() - listing.createdAt.getTime());
    const elapsedPct = Math.max(0, Math.min(1, (now.getTime() - listing.createdAt.getTime()) / totalDuration));
    const seed = hashCode(listing.id);
    const scheduledCount = (seed % 3) + 1;
    const scheduled = Array.from({ length: scheduledCount }, (_, index) => {
      const pct = 0.08 + ((seed + index * 37) % 84) / 100;
      const bot = bots[(seed + index * 17) % bots.length];
      const step = Math.max(1, Math.round(listing.startingBid * (0.06 + ((seed + index * 13) % 11) / 100)));
      return { pct, bot, amount: listing.startingBid + step * (index + 1) };
    }).sort((a, b) => a.pct - b.pct);

    const target = scheduled.findLast((bid) => bid.pct <= elapsedPct);
    if (!target) continue;

    const currentBid = listing.currentBid ?? listing.startingBid - 1;
    const playerIsWinning = listing.currentBidderId && !bots.some((bot: BotSoldierRow) => bot.id === listing.currentBidderId);
    let amount = target.amount;
    if (playerIsWinning && listing.currentBid && listing.currentBid >= amount) {
      const maxBotBid = Math.round(listing.startingBid * 2);
      const counter = listing.currentBid + Math.max(1, Math.round(listing.startingBid * 0.08));
      if (counter <= maxBotBid) amount = counter;
    }

    if (listing.currentBidderId === target.bot.id || amount <= currentBid) continue;

    await db.$transaction(async (tx) => {
      if (listing.currentBidderId && playerIsWinning && listing.currentBid) {
        await refundOutbidPlayer(tx, listing.currentBidderId, listing.currentBid);
      }
      await tx.auctionListing.update({
        where: { id: listing.id },
        data: { currentBid: amount, currentBidderId: target.bot.id },
      });
      await tx.auctionBid.create({ data: { listingId: listing.id, bidderId: target.bot.id, amount } });
    });
    created += 1;
  }
  return created;
}

async function refundOutbidPlayer(tx: AuctionTx, soldierId: string, amount: number) {
  const soldier = await tx.soldier.findUnique({
    where: { id: soldierId },
    select: {
      userId: true,
      coins: true,
      user: { select: { gameSave: { select: { state: true } } } },
    },
  });
  if (!soldier) return;

  const savedState = soldier.user.gameSave?.state;
  if (!savedState) {
    await tx.soldier.update({
      where: { id: soldierId },
      data: { coins: soldier.coins + amount },
    });
    return;
  }

  const state = normalizeGameState(savedState as unknown as GameState);
  const next = normalizeGameState({
    ...state,
    soldier: { ...state.soldier, coins: state.soldier.coins + amount },
  });
  const stateJson = next as unknown as Prisma.InputJsonValue;

  await tx.soldier.update({
    where: { id: soldierId },
    data: { coins: next.soldier.coins, saveState: stateJson },
  });
  await tx.gameSave.update({
    where: { userId: soldier.userId },
    data: { state: stateJson },
  });
}

async function createAuctionMessages(db: AuctionHouseDb, listing: AuctionListingRow, now: Date) {
  let count = 0;
  const itemName = getItem(listing.itemId)?.name ?? listing.itemId;

  if (listing.status === "expired" && listing.sellerId !== SYSTEM_AUCTION_SELLER_ID) {
    await createMessage(db, {
      recipientId: listing.sellerId,
      kind: "auction_return_item",
      auctionListingId: listing.id,
      title: "Lote sin comprador",
      body: `La lonja devuelve ${itemName}. Nadie sostuvo la puja final.`,
      payload: { listingId: listing.id, itemId: listing.itemId, quantity: listing.quantity, role: "seller" },
      createdAt: now,
    });
    count += 1;
  }

  if (listing.status === "sold" && listing.currentBidderId) {
    await createMessage(db, {
      recipientId: listing.currentBidderId,
      kind: "auction_won_item",
      auctionListingId: listing.id,
      title: "Subasta ganada",
      body: `La escribania de la lonja guarda ${itemName} a tu nombre.`,
      payload: { listingId: listing.id, itemId: listing.itemId, quantity: listing.quantity, role: "winner" },
      createdAt: now,
    });
    count += 1;

    if (listing.sellerId !== SYSTEM_AUCTION_SELLER_ID) {
      const winningBid = listing.currentBid ?? listing.startingBid;
      const coins = winningBid - Math.max(1, Math.floor(winningBid * 0.05));
      await createMessage(db, {
        recipientId: listing.sellerId,
        kind: "auction_sold_coins",
        auctionListingId: listing.id,
        title: "Lote vendido",
        body: `${itemName} se vendio por ${winningBid} doblones. La lonja retuvo su tasa.`,
        payload: { listingId: listing.id, coins, role: "seller" },
        createdAt: now,
      });
      count += 1;
    }
  }

  return count;
}

async function createMessage(
  db: AuctionHouseDb,
  data: {
    recipientId: string;
    kind: string;
    auctionListingId: string;
    title: string;
    body: string;
    payload: Record<string, string | number>;
    createdAt: Date;
  },
) {
  await db.gameMessage.upsert({
    where: {
      recipientId_kind_auctionListingId: {
        recipientId: data.recipientId,
        kind: data.kind,
        auctionListingId: data.auctionListingId,
      },
    },
    update: {},
    create: data,
  });
}

function pickSystemAuctionItems(now: Date, count: number) {
  return buildSystemAuctionPlan(now, count);
}
