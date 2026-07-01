// ArenaPage: tavern duel list. Renders against the real GameState store.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
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

import ArenaPage from "@/app/arena/page";
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

describe("ArenaPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
  });

  it("renders the ArenaSkeleton while loading", () => {
    installReadyStore();
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<ArenaPage />);
    expect(container.querySelector(".skeleton-shimmer")).not.toBeNull();
  });

  it("renders the arena page when ready", () => {
    installReadyStore();
    const { container } = render(<ArenaPage />);
    // Page renders without throwing.
    expect(container.firstChild).not.toBeNull();
  });

  it("keeps the duel board at a readable 75/25 desktop split", () => {
    installReadyStore();
    const { container } = render(<ArenaPage />);
    const hasReadableArenaSplit = Array.from(container.querySelectorAll(".grid")).some((element) =>
      element.className.includes("xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]"),
    );

    expect(hasReadableArenaSplit).toBe(true);
  });
});
