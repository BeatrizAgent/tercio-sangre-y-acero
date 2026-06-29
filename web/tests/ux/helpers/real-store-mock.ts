// real-store-mock: installs a real, in-memory GameState behind the
// useGameStore module mock so page tests can render against a genuine store
// shape (not a hand-picked subset of fields). The actions on the store are
// the real domain functions, so the page exercises the same code paths the
// browser would.

import { vi } from "vitest";
import type { GameState } from "@/lib/types";
import { createInitialState } from "../../../src/lib/game-store";

export interface RealStoreHandle {
  /** Update the store; mimics zustand `setState`. */
  setState: (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => void;
  /** Get the current GameState. */
  getState: () => GameState;
  /** Subscribe to changes. */
  subscribe: (listener: () => void) => () => void;
  /** Reset to a fresh initial state. */
  reset: () => void;
  /** The vi.fn used as the `useGameStore` default export. Tests that need
   *  to inspect calls can read it. */
  useGameStore: ReturnType<typeof vi.fn>;
}

export interface InstallRealStoreOptions {
  initial?: GameState;
}

/**
 * Installs a `useGameStore` mock backed by an in-memory GameState. Returns a
 * handle the test can use to drive the store directly (no React).
 */
export function installRealStore(options: InstallRealStoreOptions = {}): RealStoreHandle {
  const state: { current: GameState } = { current: options.initial ?? createInitialState() };
  const listeners = new Set<() => void>();

  const setState: RealStoreHandle["setState"] = (partial) => {
    const update = typeof partial === "function" ? partial(state.current) : partial;
    state.current = { ...state.current, ...update };
    listeners.forEach((l) => l());
  };
  const getState = () => state.current;
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const reset = () => {
    state.current = options.initial ?? createInitialState();
    listeners.clear();
  };

  const useGameStore = vi.fn((selector: (s: GameState) => unknown) => selector(state.current));
  Object.assign(useGameStore, { getState, setState, subscribe });

  vi.mock("@/lib/game-store", () => ({ useGameStore }));

  return { setState, getState, subscribe, reset, useGameStore };
}

/**
 * Variant that returns the mock factory so the caller can `vi.mock(...)`
 * from inside the test file (instead of having this helper do it).
 */
export function makeRealStoreMock() {
  return vi.hoisted(() => {
    const state: { current: GameState } = { current: createInitialState() };
    const listeners = new Set<() => void>();
    return { state, listeners };
  });
}
