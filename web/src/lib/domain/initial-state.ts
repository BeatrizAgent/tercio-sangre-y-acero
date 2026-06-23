import { inventoryWithAutoLayout } from "./inventory-grid";
import { normalizeActiveCharacterId, normalizePlayableRoster, PLAYER_CHARACTER_ID } from "./player-character";
import type { GameState } from "../types";

function rosterWithSoldier(state: GameState): GameState {
  const characters = normalizePlayableRoster(state);
  return {
    ...state,
    characters,
    activeCharacterId: normalizeActiveCharacterId(state, characters),
  };
}

export function normalizeGameState(state: GameState): GameState {
  const soldier = {
    ...state.soldier,
    inventory: inventoryWithAutoLayout(state.soldier.inventory ?? []),
  };

  return rosterWithSoldier({ ...state, soldier });
}

export function createInitialState(soldierName = "Diego de Arce", portraitAssetId?: string): GameState {
  const state: GameState = {
    soldier: {
      id: "diego_de_arce",
      name: soldierName,
      rank: "bisono",
      coins: 25,
      honor: 0,
      xp: 0,
      fatigue: 0,
      unpaidWages: 0,
      reputation: 0,
      corruption: 0,
      banMissionsLeft: 0,
      portraitAssetId,
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
    },
    characters: [],
    activeCharacterId: PLAYER_CHARACTER_ID,
    reports: [],
    arenaResults: [],
    activeEvent: null,
    pendingMissionId: null,
  };

  return normalizeGameState(state);
}
