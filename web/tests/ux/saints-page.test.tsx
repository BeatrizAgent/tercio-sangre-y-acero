// SaintsPage: missions + goals + panteon + chamber. Renders against the
// real GameState store.

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

import SaintsPage from "@/app/saints/page";
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

describe("SaintsPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
  });

  it("shows the SaintsSkeleton while loading", () => {
    installReadyStore();
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<SaintsPage />);
    expect(container.querySelector(".skeleton-shimmer")).not.toBeNull();
  });

  it("renders the saints page when ready", () => {
    installReadyStore();
    const { container } = render(<SaintsPage />);
    expect(container.firstChild).not.toBeNull();
  });
});
