// Test builders for the resource fields on the soldier (reputation, honor,
// corruption, unpaid wages, ban missions, action points). Follows the same
// pattern as `withCoins`, `withXp`, `withFatigue` in state-fixtures.

import type { GameState, StatId } from "../../src/lib/types";

export function withReputation(state: GameState, reputation: number): GameState {
  return { ...state, soldier: { ...state.soldier, reputation } };
}

export function withHonor(state: GameState, honor: number): GameState {
  return { ...state, soldier: { ...state.soldier, honor } };
}

export function withCorruption(state: GameState, corruption: number): GameState {
  return { ...state, soldier: { ...state.soldier, corruption } };
}

export function withUnpaidWages(state: GameState, unpaidWages: number): GameState {
  return { ...state, soldier: { ...state.soldier, unpaidWages } };
}

export function withBanMissions(state: GameState, banMissionsLeft: number): GameState {
  return { ...state, soldier: { ...state.soldier, banMissionsLeft } };
}

export function withActionPoints(state: GameState, actionPoints: number, lastRegenAt?: string): GameState {
  return {
    ...state,
    soldier: {
      ...state.soldier,
      actionPoints,
      ...(lastRegenAt ? { lastRegenAt } : {}),
    },
  };
}

export function withStat(state: GameState, stat: StatId, value: number): GameState {
  return {
    ...state,
    soldier: { ...state.soldier, stats: { ...state.soldier.stats, [stat]: value } },
  };
}
