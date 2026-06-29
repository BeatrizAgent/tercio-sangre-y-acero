// TrainingPage: stat training with optimistic action. Renders against the
// real GameState store.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
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

import TrainingPage from "@/app/training/page";
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

describe("TrainingPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
  });

  it("shows the TrainingSkeleton while loading", () => {
    installReadyStore();
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<TrainingPage />);
    expect(container.querySelector(".skeleton-shimmer")).not.toBeNull();
  });

  it("renders the training content when ready", async () => {
    installReadyStore();
    let result: { container: HTMLElement } = { container: document.createElement("div") };
    await act(async () => {
      result = render(<TrainingPage />);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.container.firstChild).not.toBeNull();
  });
});
