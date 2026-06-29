// Shared helper for UX page tests: install a real, in-memory GameState
// behind the useGameStore module mock. Same shape as
// tests/ux/helpers/real-store-mock.ts but exposed as a hoisted factory
// so it can be used inside `beforeEach`.

import { vi } from "vitest";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState } from "@/lib/types";

export interface PageStoreHandle {
  state: { current: GameState };
  setState: (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => void;
  getState: () => GameState;
}

export function installRealStore(): PageStoreHandle {
  const state: { current: GameState } = { current: createInitialState() };
  const listeners = new Set<() => void>();
  return {
    state,
    getState: () => state.current,
    setState: (partial) => {
      const update = typeof partial === "function" ? partial(state.current) : partial;
      state.current = { ...state.current, ...update };
      listeners.forEach((l) => l());
    },
  };
}

export function installStoreMocks(store: PageStoreHandle) {
  const useGameDataMock = vi.fn();
  const useGameStoreMock = vi.fn((selector?: (s: GameState) => unknown) =>
    selector ? selector(store.state.current) : store.state.current,
  );
  Object.assign(useGameStoreMock, {
    getState: store.getState,
    setState: store.setState,
    subscribe: (l: () => void) => {
      const listeners = new Set<() => void>();
      listeners.add(l);
      return () => listeners.delete(l);
    },
  });
  return { useGameDataMock, useGameStoreMock };
}
