import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GameState } from "./types";

const statePath = path.join(process.cwd(), ".demo", "state.json");

export function createInitialState(): GameState {
  return {
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
      inventory: [
        { itemId: "rusty_pike", quantity: 1 },
        { itemId: "patched_doublet", quantity: 1 },
        { itemId: "hard_bread", quantity: 2 },
        { itemId: "clean_bandage", quantity: 2 },
      ],
      equipment: {
        head: null,
        body: "patched_doublet",
        mainHand: "rusty_pike",
        offHand: null,
        firearm: null,
        accessory: null,
        boots: null,
        consumable: null,
      },
      wounds: [],
    },
    reports: [],
    activeEvent: null,
    pendingMissionId: null,
  };
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
