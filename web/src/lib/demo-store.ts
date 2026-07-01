import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GameState } from "./types";
import { inventoryWithAutoLayout } from "./domain/inventory-grid";
import { createInitialRoster, PLAYER_CHARACTER_ID } from "./domain/player-character";
import { normalizeGameState } from "./domain/initial-state";

const statePath = path.join(process.cwd(), ".demo", "state.json");

export function createInitialState(portraitAssetId?: string): GameState {
  const state: GameState = {
    soldier: {
      id: "diego_de_arce",
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
      portraitAssetId,
      stats: {
        pike: 1,
        sword: 1,
        arquebus: 1,
        discipline: 1,
        vigor: 1,
        cunning: 1,
        command: 0,
      },
      inventory: inventoryWithAutoLayout([
        { itemId: "consumable_pan_duro_001", quantity: 2 },
        { itemId: "consumable_vendas_001", quantity: 2 },
      ]),
      equipment: {
        head: null,
        body: null,
        mainHand: null,
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
  state.characters = (state.characters.length > 0 ? state.characters : createInitialRoster(state.soldier)).map((character) =>
    character.id === PLAYER_CHARACTER_ID
      ? {
          ...character,
          name: state.soldier.name,
          rank: state.soldier.rank,
          fatigue: state.soldier.fatigue,
          stats: { ...state.soldier.stats },
          equipment: { ...state.soldier.equipment },
          portraitAssetId: state.soldier.portraitAssetId ?? character.portraitAssetId,
        }
      : character,
  );
  return normalizeGameState(state);
}

export async function getState(): Promise<GameState> {
  try {
    const raw = await readFile(statePath, "utf8");
    const state = normalizeGameState(JSON.parse(raw) as GameState);
    await saveState(state);
    return state;
  } catch {
    const state = createInitialState();
    await saveState(state);
    return state;
  }
}

export async function saveState(state: GameState): Promise<void> {
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(normalizeGameState(state), null, 2));
}

export async function resetState(): Promise<GameState> {
  const state = createInitialState();
  await saveState(state);
  return state;
}
