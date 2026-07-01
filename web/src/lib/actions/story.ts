"use server";

import { revalidatePath } from "next/cache";
import { resolveStoryChoiceInState } from "../domain/story";
import { fail, ok, type ActionResult } from "../domain/result";
import { consumeActionGate } from "../server/action-gate-store";
import { canFallbackToFilesystem, loadGameState, persistGameState, shouldUseDatabase } from "./_demo";
import { getDb } from "../db";
import { getItem } from "../data/items";
import { requireApiSession } from "../auth/session";
import type { GameState } from "../types";

export interface ResolveStoryChoiceArgs {
  chapterId: string;
  choiceId: string;
  puzzleAnswer?: string[];
  gateToken?: string;
}

export async function resolveStoryChoiceAction({
  chapterId,
  choiceId,
  puzzleAnswer,
  gateToken,
}: ResolveStoryChoiceArgs): Promise<ActionResult<{ state: GameState; reportId?: string }>> {
  const gate = consumeActionGate({
    token: gateToken,
    kind: "story",
    targetId: `${chapterId}:${choiceId}`,
  });
  if (!gate.ok) return fail(gate.message);

  const useDb = shouldUseDatabase();
  const state = await loadGameState();
  const out = resolveStoryChoiceInState({ state, chapterId, choiceId, puzzleAnswer, mailItems: useDb });
  if (!out.result.ok) return out.result as ActionResult<{ state: GameState; reportId?: string }>;

  await persistGameState(out.next);

  if (useDb && out.result.data?.mailedItems?.length) {
    try {
      await deliverStoryRewardsToMailbox(out.result.data.mailedItems, chapterId);
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
    }
  }

  revalidatePath("/missions");
  revalidatePath("/reports");
  revalidatePath("/soldier");
  revalidatePath("/mailbox");
  return ok(out.result.message, { state: out.next, reportId: out.result.data?.reportId });
}

async function deliverStoryRewardsToMailbox(
  mailedItems: { itemId: string; quantity: number }[],
  chapterId: string,
): Promise<void> {
  const session = await requireApiSession();
  const db = getDb();
  const soldier = await db.soldier.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!soldier) return;
  const now = new Date();
  for (const entry of mailedItems) {
    const itemName = getItem(entry.itemId)?.name ?? entry.itemId;
    await db.gameMessage.create({
      data: {
        recipientId: soldier.id,
        kind: "story_reward_item",
        title: "Recompensa del cuartel",
        body: `El escribano guarda ${entry.quantity > 1 ? `${entry.quantity}x ${itemName}` : itemName} de tu ultima decision en ${chapterId}.`,
        payload: { itemId: entry.itemId, quantity: entry.quantity, chapterId },
        createdAt: now,
      },
    });
  }
}
