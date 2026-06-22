// Test fixtures for GameState.
// Keeps tests independent of Zustand persistence and localStorage.

import { inventoryWithAutoLayout } from "../../src/lib/domain/inventory-grid";
import { createCharacterStates } from "../../src/lib/data/characters";
import type { GameState, Soldier, StatId } from "../../src/lib/types";

const PLAYER_CHARACTER_ID = "diego_de_arce";

export function createBaseSoldier(overrides: Partial<Soldier> = {}): Soldier {
  const soldier: Soldier = {
    id: PLAYER_CHARACTER_ID,
    name: "Diego de Arce",
    rank: "bisono",
    coins: 25,
    honor: 0,
    xp: 0,
    fatigue: 0,
    unpaidWages: 0,
    reputation: 0,
    corruption: 0,
    banMissionsLeft: 0,
    stats: { pike: 2, sword: 1, arquebus: 1, discipline: 2, vigor: 2, cunning: 1, command: 0 },
    inventory: inventoryWithAutoLayout([
      { itemId: "weapon_pica_gastada_001", quantity: 1 },
      { itemId: "chest_cuirass_001", quantity: 1 },
      { itemId: "consumable_pan_duro_001", quantity: 2 },
      { itemId: "consumable_vendas_001", quantity: 2 },
    ]),
    equipment: {
      head: null,
      body: "chest_cuirass_001",
      mainHand: "weapon_pica_gastada_001",
      offHand: null,
      firearm: null,
      accessory: null,
      boots: null,
      consumable: null,
    },
    wounds: [],
    ...overrides,
  };
  return soldier;
}

type GameStateOverrides = Partial<Omit<GameState, "soldier">> & {
  soldier?: Partial<Soldier>;
};

export function createTestState(overrides: GameStateOverrides = {}): GameState {
  const { soldier: soldierOverride, ...gameOverrides } = overrides;
  const soldier = createBaseSoldier(soldierOverride);
  const characters = createCharacterStates().map((character) =>
    character.id === PLAYER_CHARACTER_ID
      ? {
          ...character,
          name: soldier.name,
          rank: soldier.rank,
          fatigue: soldier.fatigue,
          stats: { ...soldier.stats },
          equipment: { ...soldier.equipment },
        }
      : character,
  );
  return {
    soldier,
    characters,
    activeCharacterId: PLAYER_CHARACTER_ID,
    reports: [],
    arenaResults: [],
    activeEvent: null,
    pendingMissionId: null,
    ...gameOverrides,
  };
}

export function withCoins(state: GameState, coins: number): GameState {
  return { ...state, soldier: { ...state.soldier, coins } };
}

export function withXp(state: GameState, xp: number): GameState {
  return { ...state, soldier: { ...state.soldier, xp } };
}

export function withFatigue(state: GameState, fatigue: number): GameState {
  return { ...state, soldier: { ...state.soldier, fatigue } };
}

export function withStat(state: GameState, stat: StatId, value: number): GameState {
  return { ...state, soldier: { ...state.soldier, stats: { ...state.soldier.stats, [stat]: value } } };
}

export function withInventory(state: GameState, itemIds: string[]): GameState {
  const inventory = inventoryWithAutoLayout(itemIds.map((itemId) => ({ itemId, quantity: 1 })));
  return { ...state, soldier: { ...state.soldier, inventory } };
}

export function withWound(state: GameState, woundId: string, treated = false): GameState {
  return {
    ...state,
    soldier: {
      ...state.soldier,
      wounds: [...state.soldier.wounds, { id: `${woundId}_test`, woundId, treated }],
    },
  };
}
