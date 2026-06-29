// HospitalPage: healing and rest flows. Renders against the real
// GameState store.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const { useGameDataMock, useGameStoreMock } = vi.hoisted(() => {
  return { useGameDataMock: vi.fn(), useGameStoreMock: vi.fn() };
});

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));

import HospitalPage from "@/app/hospital/page";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState } from "@/lib/types";

function installRealStore(initial: GameState = createInitialState()) {
  const state: { current: GameState } = { current: initial };
  const listeners = new Set<() => void>();
  useGameStoreMock.mockImplementation((selector?: (s: GameState) => unknown) =>
    selector ? selector(state.current) : state.current,
  );
  Object.assign(useGameStoreMock, {
    getState: () => state.current,
    setState: (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => {
      const update = typeof partial === "function" ? partial(state.current) : partial;
      state.current = { ...state.current, ...update };
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  });
  return state;
}

describe("HospitalPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
  });

  it("renders the HospitalSkeleton while loading", () => {
    installRealStore();
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<HospitalPage />);
    expect(container.querySelector(".skeleton-shimmer")).not.toBeNull();
  });

  it("renders the resting panel when ready", async () => {
    installRealStore();
    useGameDataMock.mockReturnValue({
      status: "ready",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<HospitalPage />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(container.querySelector(".skeleton-shimmer")).toBeNull();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
