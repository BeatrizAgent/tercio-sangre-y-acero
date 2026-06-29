// CityPage: hub with spots linking to /soldier, /training, etc. Renders
// against the real store.

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

import CityPage from "@/app/city/page";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState } from "@/lib/types";

function installReadyStore() {
  const state: { current: GameState } = { current: createInitialState() };
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

describe("CityPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
  });

  it("renders the city spot links", () => {
    installReadyStore();
    const { container } = render(<CityPage />);
    // The page has spots linking to /soldier, /training, etc.
    const links = container.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders the city hub page with at least one link", () => {
    installReadyStore();
    const { container } = render(<CityPage />);
    const links = container.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
  });
});
