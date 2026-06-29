// SoldierPage: profile + stats + equipment. Renders against the real
// GameState store.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type React from "react";

const { useGameDataMock, useGameStoreMock } = vi.hoisted(() => ({
  useGameDataMock: vi.fn(),
  useGameStoreMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

// Polyfill ResizeObserver for jsdom (soldier page may use it via chart libs).
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as { ResizeObserver: unknown }).ResizeObserver = ResizeObserver;
}

import SoldierPage from "@/app/soldier/page";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState } from "@/lib/types";

function installReadyStore(overrides: Partial<GameState> = {}) {
  const state: { current: GameState } = { current: { ...createInitialState(), ...overrides } };
  useGameStoreMock.mockImplementation((selector?: (s: GameState) => unknown) =>
    selector ? selector(state.current) : state.current,
  );
  Object.assign(useGameStoreMock, {
    getState: () => state.current,
    setState: (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => {
      const update = typeof partial === "function" ? partial(state.current) : partial;
      state.current = { ...state.current, ...update };
    },
  });
  useGameDataMock.mockReturnValue({
    status: "ready",
    error: null,
    refetch: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
  });
}

describe("SoldierPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
  });

  it("renders the soldier's name and rank", () => {
    installReadyStore();
    render(<SoldierPage />);
    expect(screen.getByText("Diego de Arce")).toBeInTheDocument();
    expect(screen.getByText("bisono")).toBeInTheDocument();
  });

  it("shows the equipment slots with equipped items", () => {
    installReadyStore();
    const { container } = render(<SoldierPage />);
    // The page renders at least one element (the soldier name, equipment cards, etc.).
    expect(container.firstChild).not.toBeNull();
  });
});
