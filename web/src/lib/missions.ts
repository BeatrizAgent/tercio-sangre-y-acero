import { missionDefinitions } from "./game-data";
import { getState, saveState } from "./demo-store";
import { getNextRank } from "./soldier";
import { resolveMission } from "./domain/resolver";

export function listAvailableMissions() {
  return missionDefinitions;
}

export function getMission(missionId: string) {
  return missionDefinitions.find((mission) => mission.id === missionId);
}

export async function applyMissionRewards(missionId: string) {
  const mission = getMission(missionId);
  if (!mission) return { ok: false, message: "Unknown mission.", reportId: "" };

  const state = await getState();
  const result = resolveMission(state.soldier, mission);
  state.soldier.coins += result.rewards.coins;
  state.soldier.xp += result.rewards.xp;
  state.soldier.honor += result.rewards.honor;
  state.soldier.fatigue = Math.min(100, state.soldier.fatigue + result.fatigue);
  for (const woundId of result.wounds) {
    state.soldier.wounds.push({ id: `${woundId}_${Date.now()}`, woundId, treated: false });
  }
  for (const drop of result.loot) {
    const owned = state.soldier.inventory.find((item) => item.itemId === drop.itemId);
    if (owned) owned.quantity += drop.quantity;
    else state.soldier.inventory.push(drop);
  }
  const nextRank = getNextRank(state.soldier.xp, state.soldier.honor);
  if (nextRank) state.soldier.rank = nextRank.id;
  state.reports.unshift(result);
  await saveState(state);
  return { ok: true, message: "Mission resolved.", reportId: result.id };
}

export async function getReport(reportId: string) {
  const state = await getState();
  return state.reports.find((report) => report.id === reportId);
}
