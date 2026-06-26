"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { getItem } from "../data/items";
import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS } from "../domain/inventory-grid";
import { fail, ok, type ActionResult } from "../domain/result";
import { requireApiSession } from "../auth/session";
import { canFallbackToFilesystem, loadGameState, persistGameState, shouldUseDatabase } from "./_demo";
import type { GameState } from "../types";
import type { GameMessage } from "@/generated/prisma/client";

export interface GameMessageView {
  id: string;
  kind: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  claimedAt: string | null;
  claimLabel: string | null;
  itemId: string | null;
  coins: number | null;
}

interface MessagePayload {
  listingId?: string;
  itemId?: string;
  quantity?: number;
  coins?: number;
  role?: "winner" | "seller";
}

export async function listGameMessagesAction(): Promise<ActionResult<{ messages: GameMessageView[] }>> {
  const session = await requireApiSession();
  if (shouldUseDatabase()) {
    try {
      const db = getDb();
      const soldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!soldier) return fail("Soldado no encontrado.");

      const rows = await db.gameMessage.findMany({
        where: { recipientId: soldier.id },
        orderBy: { createdAt: "desc" },
        take: 40,
      });

      return ok("Correo cargado.", {
        messages: rows.map((row) => toMessageView(row)),
      });
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
    }
  }

  return ok("Correo cargado (Modo Demo sin Base de Datos).", { messages: [] });
}

export async function claimGameMessageAction({ messageId }: { messageId: string }): Promise<ActionResult<{ state: GameState }>> {
  const session = await requireApiSession();
  if (shouldUseDatabase()) {
    try {
      const db = getDb();
      const soldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!soldier) return fail("Soldado no encontrado.");

      const message = await db.gameMessage.findUnique({ where: { id: messageId } });
      if (!message || message.recipientId !== soldier.id) return fail("Carta no encontrada.");
      return claimGameMessageRow(message);
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
    }
  }

  return fail("El buzon requiere una base de datos PostgreSQL activa.");
}

export async function claimAuctionMessageForListing(listingId: string): Promise<ActionResult<{ state: GameState }>> {
  const session = await requireApiSession();
  const db = getDb();
  const soldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!soldier) return fail("Soldado no encontrado.");

  const message = await db.gameMessage.findFirst({
    where: {
      recipientId: soldier.id,
      auctionListingId: listingId,
      claimedAt: null,
      kind: { in: ["auction_won_item", "auction_sold_coins", "auction_return_item"] },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!message) return fail("No hay correo pendiente para esta subasta.");

  return claimGameMessageRow(message);
}

async function claimGameMessageRow(message: GameMessage): Promise<ActionResult<{ state: GameState }>> {
  if (message.claimedAt) return fail("Esta carta ya fue reclamada.");
  const payload = parsePayload(message.payload);
  if (!payload.itemId && !payload.coins) return fail("Esta carta no trae adjuntos.");

  const state = await loadGameState();
  let next: GameState = state;

  if (payload.itemId) {
    const quantity = Math.max(1, payload.quantity ?? 1);
    const inserted = addInventoryItem(
      state.soldier.inventory,
      payload.itemId,
      quantity,
      BACKPACK_COLS,
      BACKPACK_ROWS,
      BACKPACK_CHESTS,
    );
    if (!inserted.ok) return fail("No hay espacio en ningun baul para recoger el adjunto.");
    next = { ...next, soldier: { ...next.soldier, inventory: inserted.inventory } };
  }

  if (payload.coins) {
    next = { ...next, soldier: { ...next.soldier, coins: next.soldier.coins + payload.coins } };
  }

  await persistGameState(next);

  const now = new Date();
  const db = getDb();
  await db.$transaction(async (tx) => {
    await tx.gameMessage.update({
      where: { id: message.id },
      data: { claimedAt: now, readAt: message.readAt ?? now },
    });
    if (payload.listingId && payload.role === "winner") {
      await tx.auctionListing.update({
        where: { id: payload.listingId },
        data: { winnerClaimedAt: now },
      });
    }
    if (payload.listingId && payload.role === "seller") {
      await tx.auctionListing.update({
        where: { id: payload.listingId },
        data: { sellerClaimedAt: now },
      });
    }
  });

  revalidateMailboxPaths();
  const label = payload.itemId ? getItem(payload.itemId)?.name ?? payload.itemId : `${payload.coins} doblones`;
  return ok(`Adjunto recogido: ${label}.`, { state: next });
}

function toMessageView(row: GameMessage): GameMessageView {
  const payload = parsePayload(row.payload);
  const itemName = payload.itemId ? getItem(payload.itemId)?.name ?? payload.itemId : null;
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : null,
    claimedAt: row.claimedAt ? row.claimedAt.toISOString() : null,
    claimLabel: payload.itemId ? `Recoger ${itemName}` : payload.coins ? `Cobrar ${payload.coins} doblones` : null,
    itemId: payload.itemId ?? null,
    coins: payload.coins ?? null,
  };
}

function parsePayload(payload: unknown): MessagePayload {
  if (!payload || typeof payload !== "object") return {};
  return payload as MessagePayload;
}

function revalidateMailboxPaths() {
  revalidatePath("/mailbox");
  revalidatePath("/market");
  revalidatePath("/inventory");
  revalidatePath("/soldier");
}
