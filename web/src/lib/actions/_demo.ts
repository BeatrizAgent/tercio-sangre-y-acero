// Dev fallback: the actions/ layer persists game state through this
// module. Today it writes to .demo/state.json via the demo-store. When
// Django enters, the swap is local: replace the body of these helpers
// with calls into the future lib/api/* client and the rest of the
// actions/ tree keeps working unchanged.

import { getState, resetState, saveState } from "../demo-store";
import type { GameState } from "../types";

export async function loadGameState(): Promise<GameState> {
  return getState();
}

export async function persistGameState(state: GameState): Promise<void> {
  await saveState(state);
}

export async function resetGameState(): Promise<GameState> {
  return resetState();
}
