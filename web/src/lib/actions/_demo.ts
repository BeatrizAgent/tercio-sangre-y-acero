// Dev fallback: the actions/ layer persists game state through this
// module. Today it writes to .demo/state.json via the demo-store. When
// Django enters, the swap is local: replace the body of these helpers
// with calls into the future lib/api/* client and the rest of the
// actions/ tree keeps working unchanged.

import { Prisma } from "@/generated/prisma/client";
import { createInitialState, getState, resetState, saveState } from "../demo-store";
import { getDb } from "../db";
import type { GameState } from "../types";

const DEMO_EMAIL = "demo@tercio.local";
const DEMO_NAME = "Demo User";

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL) && process.env.TERCIO_DEMO_STORE !== "filesystem";
}

function canFallbackToFilesystem() {
  return process.env.NODE_ENV !== "production" && process.env.TERCIO_DEMO_STORE !== "database";
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function loadGameState(): Promise<GameState> {
  if (shouldUseDatabase()) {
    try {
      const db = getDb();
      const user = await db.user.findUnique({
        where: { email: DEMO_EMAIL },
        include: { gameSave: true },
      });

      if (user?.gameSave?.state) return user.gameSave.state as unknown as GameState;

      const state = createInitialState();
      await persistGameState(state);
      return state;
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
      return getState();
    }
  }

  return getState();
}

export async function persistGameState(state: GameState): Promise<void> {
  if (shouldUseDatabase()) {
    try {
      const db = getDb();
      await db.$transaction(async (tx) => {
        const user = await tx.user.upsert({
          where: { email: DEMO_EMAIL },
          update: {},
          create: { email: DEMO_EMAIL, name: DEMO_NAME },
        });

        const soldier = await tx.soldier.upsert({
          where: { userId: user.id },
          update: {
            name: state.soldier.name,
            rank: state.soldier.rank,
            coins: state.soldier.coins,
            honor: state.soldier.honor,
            xp: state.soldier.xp,
            fatigue: state.soldier.fatigue,
            unpaidWages: state.soldier.unpaidWages,
            reputation: state.soldier.reputation,
            corruption: state.soldier.corruption,
            banMissionsLeft: state.soldier.banMissionsLeft,
            saveState: json(state),
          },
          create: {
            userId: user.id,
            name: state.soldier.name,
            rank: state.soldier.rank,
            coins: state.soldier.coins,
            honor: state.soldier.honor,
            xp: state.soldier.xp,
            fatigue: state.soldier.fatigue,
            unpaidWages: state.soldier.unpaidWages,
            reputation: state.soldier.reputation,
            corruption: state.soldier.corruption,
            banMissionsLeft: state.soldier.banMissionsLeft,
            saveState: json(state),
          },
        });

        await tx.soldierStats.upsert({
          where: { soldierId: soldier.id },
          update: { ...state.soldier.stats },
          create: { soldierId: soldier.id, ...state.soldier.stats },
        });

        await tx.equipment.upsert({
          where: { soldierId: soldier.id },
          update: { ...state.soldier.equipment },
          create: { soldierId: soldier.id, ...state.soldier.equipment },
        });

        await tx.inventoryItem.deleteMany({ where: { soldierId: soldier.id } });
        if (state.soldier.inventory.length > 0) {
          await tx.inventoryItem.createMany({
            data: state.soldier.inventory.map((item) => ({
              soldierId: soldier.id,
              itemId: item.itemId,
              quantity: item.quantity,
            })),
          });
        }

        await tx.activeWound.deleteMany({ where: { soldierId: soldier.id } });
        if (state.soldier.wounds.length > 0) {
          await tx.activeWound.createMany({
            data: state.soldier.wounds.map((wound) => ({
              id: wound.id,
              soldierId: soldier.id,
              woundId: wound.woundId,
              treated: wound.treated,
            })),
          });
        }

        await tx.missionResult.deleteMany({ where: { soldierId: soldier.id } });
        if (state.reports.length > 0) {
          await tx.missionResult.createMany({
            data: state.reports.map((report) => ({
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
          update: { state: json(state) },
          create: { userId: user.id, state: json(state) },
        });
      });
    } catch (error) {
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
      const state = createInitialState();
      await persistGameState(state);
      return state;
    } catch (error) {
      if (!canFallbackToFilesystem()) throw error;
      return resetState();
    }
  }

  return resetState();
}
