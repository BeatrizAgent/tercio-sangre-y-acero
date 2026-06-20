// Mission domain: applies a resolved mission result to a state. The combat
// math itself lives in lib/domain/resolver.ts and lib/domain/combat/.

import { getMission } from "../data/missions";
import { getNextRank } from "../data/ranks";
import { resolveMission } from "./resolver";
import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS } from "./inventory-grid";
import { fail, ok, type ActionResult } from "./result";
import type { GameState } from "../types";

export function applyMissionRewardsInState(
  state: GameState,
  missionId: string,
): { next: GameState; result: ActionResult<{ reportId?: string }> } {
  const mission = getMission(missionId);
  if (!mission) return { next: state, result: fail("Misión desconocida.") };

  const result = resolveMission(state.soldier, mission);
  const soldier = {
    ...state.soldier,
    coins: state.soldier.coins + result.rewards.coins,
    xp: state.soldier.xp + result.rewards.xp,
    honor: state.soldier.honor + result.rewards.honor,
    fatigue: Math.min(100, state.soldier.fatigue + result.fatigue),
    wounds: [
      ...state.soldier.wounds,
      ...result.wounds.map((woundId) => ({ id: `${woundId}_${Date.now()}`, woundId, treated: false })),
    ],
  };
  let inventory = state.soldier.inventory;
  for (const drop of result.loot) {
    inventory = addInventoryItem(inventory, drop.itemId, drop.quantity, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS)
      .inventory;
  }
  const nextRank = getNextRank(soldier.xp, soldier.honor);
  if (nextRank) soldier.rank = nextRank.id;

  return {
    next: {
      ...state,
      soldier: { ...soldier, inventory },
      reports: [result, ...state.reports],
    },
    result: ok(
      result.success ? "¡Victoria!" : "Derrota en campaña.",
      { reportId: result.id },
    ),
  };
}
