// Test helper: in-memory mock of useGameStore for component tests.

import { vi } from "vitest";
import type { GameState } from "@/lib/types";
import { createInitialState } from "../../../src/lib/game-store";

type Listener = () => void;

export interface MockStoreOptions {
  state?: Partial<GameState>;
  actions?: Record<string, ReturnType<typeof vi.fn>>;
}

export function createMockStore(options: MockStoreOptions = {}) {
  const initial = createInitialState();
  const state: GameState = { ...initial, ...options.state };
  const actions = options.actions ?? {};
  const listeners = new Set<Listener>();

  const setState = (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => {
    const update = typeof partial === "function" ? partial(state) : partial;
    Object.assign(state, update);
    listeners.forEach((l) => l());
  };

  const getState = () => state;

  const api = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "getState") return getState;
        if (prop === "setState") return setState;
        if (prop === "subscribe") return (l: Listener) => {
          listeners.add(l);
          return () => listeners.delete(l);
        };
        if (prop in actions) return (actions as Record<string, unknown>)[prop as string];
        return (state as unknown as Record<string, unknown>)[prop as string];
      },
    },
  );

  return { store: api as unknown as ReturnType<typeof createInitialState> & { getState: () => GameState; setState: (p: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => void; subscribe: (l: Listener) => () => void }, actions };
}

// Re-export createInitialState for convenience.
export { createInitialState };
