// Dev fallback: the actions/ layer persists game state through this
// module. Today it writes to .demo/state.json via the demo-store. When
// Django enters, the swap is local: replace the body of these helpers
// with calls into the future lib/api/* client and the rest of the
// actions/ tree keeps working unchanged.

import { Prisma } from "@/generated/prisma/client";
import { createInitialState, getState, resetState, saveState } from "../demo-store";
import { UnauthorizedError, requireApiSession } from "../auth/session";
import { getDb } from "../db";
import { normalizeGameState } from "../domain/initial-state";
import type { GameState } from "../types";

export function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL) && process.env.TERCIO_DEMO_STORE !== "filesystem";
}

export function canFallbackToFilesystem() {
  return process.env.NODE_ENV !== "production" && process.env.TERCIO_DEMO_STORE !== "database";
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function loadGameState(): Promise<GameState> {
  if (shouldUseDatabase()) {
    try {
      const session = await requireApiSession();
      const db = getDb();
      const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { gameSave: true },
      });

      if (user?.gameSave?.state) {
        const state = normalizeGameState(user.gameSave.state as unknown as GameState);
        await persistGameStateForUser(session.userId, state);
        return state;
      }

      const state = createInitialState();
      await persistGameState(state);
      return state;
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      if (!canFallbackToFilesystem()) throw error;
      return getState();
    }
  }

  return getState();
}

export async function persistGameStateForUser(userId: string, state: GameState): Promise<void> {
  const db = getDb();
  const normalizedState = normalizeGameState(state);
  const portraitAssetId = normalizedState.soldier.portraitAssetId ?? null;
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { portraitAssetId },
    });

    const soldier = await tx.soldier.upsert({
      where: { userId: user.id },
      update: {
        name: normalizedState.soldier.name,
        rank: normalizedState.soldier.rank,
        coins: normalizedState.soldier.coins,
        honor: normalizedState.soldier.honor,
        xp: normalizedState.soldier.xp,
        fatigue: normalizedState.soldier.fatigue,
        unpaidWages: normalizedState.soldier.unpaidWages,
        reputation: normalizedState.soldier.reputation,
        corruption: normalizedState.soldier.corruption,
        banMissionsLeft: normalizedState.soldier.banMissionsLeft,
        portraitAssetId,
        saveState: json(normalizedState),
      },
      create: {
        userId: user.id,
        name: normalizedState.soldier.name,
        rank: normalizedState.soldier.rank,
        coins: normalizedState.soldier.coins,
        honor: normalizedState.soldier.honor,
        xp: normalizedState.soldier.xp,
        fatigue: normalizedState.soldier.fatigue,
        unpaidWages: normalizedState.soldier.unpaidWages,
        reputation: normalizedState.soldier.reputation,
        corruption: normalizedState.soldier.corruption,
        banMissionsLeft: normalizedState.soldier.banMissionsLeft,
        portraitAssetId,
        saveState: json(normalizedState),
      },
    });

    await tx.soldierStats.upsert({
      where: { soldierId: soldier.id },
      update: { ...normalizedState.soldier.stats },
      create: { soldierId: soldier.id, ...normalizedState.soldier.stats },
    });

    await tx.equipment.upsert({
      where: { soldierId: soldier.id },
      update: { ...normalizedState.soldier.equipment },
      create: { soldierId: soldier.id, ...normalizedState.soldier.equipment },
    });

    await tx.inventoryItem.deleteMany({ where: { soldierId: soldier.id } });
    if (normalizedState.soldier.inventory.length > 0) {
      await tx.inventoryItem.createMany({
        data: normalizedState.soldier.inventory.map((item) => ({
          soldierId: soldier.id,
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      });
    }

    await tx.activeWound.deleteMany({ where: { soldierId: soldier.id } });
    if (normalizedState.soldier.wounds.length > 0) {
      await tx.activeWound.createMany({
        data: normalizedState.soldier.wounds.map((wound) => ({
          id: wound.id,
          soldierId: soldier.id,
          woundId: wound.woundId,
          treated: wound.treated,
        })),
      });
    }

    await tx.missionResult.deleteMany({ where: { soldierId: soldier.id } });
    if (normalizedState.reports.length > 0) {
      await tx.missionResult.createMany({
        data: normalizedState.reports.map((report) => ({
          id: report.id,
          soldierId: soldier.id,
          missionId: report.missionId,
          success: report.success,
          report: report.report,
          rewards: json({ ...report.rewards }),
          wounds: json([...report.wounds]),
          loot: json(report.loot.map((item) => ({ ...item }))),
          createdAt: new Date(report.createdAt),
        })),
      });
    }

    await tx.gameSave.upsert({
      where: { userId: user.id },
      update: { state: json(normalizedState) },
      create: { userId: user.id, state: json(normalizedState) },
    });
  });
}

export async function persistGameState(state: GameState): Promise<void> {
  if (shouldUseDatabase()) {
    try {
      const session = await requireApiSession();
      await persistGameStateForUser(session.userId, state);
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      if (!canFallbackToFilesystem()) throw error;
      await saveState(state);
    }
    return;
  }

  await saveState(state);
}

export async function resetGameState(): Promise<GameState> {
  if (shouldUseDatabase()) {
    try {
      const session = await requireApiSession();
      const state = createInitialState();
      await persistGameStateForUser(session.userId, state);
      return state;
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      if (!canFallbackToFilesystem()) throw error;
      return resetState();
    }
  }

  return resetState();
}
