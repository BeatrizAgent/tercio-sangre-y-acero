import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GameState } from "./types";
import { inventoryWithAutoLayout } from "./inventory-grid";
import { createCharacterStates } from "./game-data";

const PLAYER_CHARACTER_ID = "diego_de_arce";

const statePath = path.join(process.cwd(), ".demo", "state.json");

export function createInitialState(): GameState {
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
      stats: {
        pike: 2,
        sword: 1,
        arquebus: 1,
        discipline: 2,
        vigor: 2,
        cunning: 1,
        command: 0,
      },
      inventory: inventoryWithAutoLayout([
        { itemId: "common_pike_001", quantity: 1 },
        { itemId: "armadura_003", quantity: 1 },
        { itemId: "objeto_004", quantity: 2 },
        { itemId: "objeto_002", quantity: 2 },
      ]),
      equipment: {
        head: null,
        body: "armadura_003",
        mainHand: "common_pike_001",
        offHand: null,
        firearm: null,
        accessory: null,
        boots: null,
        consumable: null,
      },
      wounds: [],
    },
    characters: createCharacterStates(),
    activeCharacterId: PLAYER_CHARACTER_ID,
    reports: [],
    arenaResults: [],
    activeEvent: null,
    pendingMissionId: null,
  };
  state.characters = state.characters.map((character) =>
    character.id === PLAYER_CHARACTER_ID
      ? {
          ...character,
          name: state.soldier.name,
          rank: state.soldier.rank,
          fatigue: state.soldier.fatigue,
          stats: { ...state.soldier.stats },
          equipment: { ...state.soldier.equipment },
        }
      : character,
  );
  return state;
}

export async function getState(): Promise<GameState> {
  try {
    const raw = await readFile(statePath, "utf8");
    return JSON.parse(raw) as GameState;
  } catch {
    const state = createInitialState();
    await saveState(state);
    return state;
  }
}

export async function saveState(state: GameState): Promise<void> {
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2));
}

export async function resetState(): Promise<GameState> {
  const state = createInitialState();
  await saveState(state);
  return state;
}
