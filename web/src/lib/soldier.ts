import { rankDefinitions } from "./game-data";
import { getState, saveState } from "./demo-store";
import type { StatId } from "./types";

export async function getCurrentSoldier() {
  return (await getState()).soldier;
}

export function getRankName(rankId: string) {
  return rankDefinitions.find((rank) => rank.id === rankId)?.name ?? rankId;
}

export function getNextRank(xp: number, honor: number) {
  return [...rankDefinitions]
    .reverse()
    .find((rank) => xp >= rank.minXp && honor >= rank.minHonor);
}

export async function addStat(stat: StatId, gain: number) {
  const state = await getState();
  state.soldier.stats[stat] += gain;
  await saveState(state);
}
