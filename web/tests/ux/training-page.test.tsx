// TrainingPage: stat training with optimistic action. Renders against the
// real GameState store.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, act, screen } from "@testing-library/react";
import type React from "react";

const { useGameDataMock, useGameStoreMock, trainStatActionMock } = vi.hoisted(() => ({
  useGameDataMock: vi.fn(),
  useGameStoreMock: vi.fn(),
  trainStatActionMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));
vi.mock("@/lib/actions/training", () => ({
  trainStatAction: trainStatActionMock,
  trainStatFormAction: vi.fn(),
}));
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
    trainStatActionMock.mockReset();
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
    expect((await screen.findAllByRole("button", { name: /Entrenar/ })).length).toBeGreaterThan(0);
  });

  it("disables the Entrenar button when the player has no coins", async () => {
    installReadyStore({ soldier: { ...createInitialState().soldier, coins: 0, xp: 0 } });
    await act(async () => {
      render(<TrainingPage />);
      await new Promise((r) => setTimeout(r, 10));
    });
    // All 7 stats cost at least 5 coins, so 0 coins => "Sin paga" on every card.
    const withoutCoins = await screen.findAllByText(/Sin paga/);
    expect(withoutCoins.length).toBeGreaterThanOrEqual(7);
  });

  it("renders a Mejorar button on each stat card during the first 10 levels", async () => {
    installReadyStore();
    await act(async () => {
      render(<TrainingPage />);
      await new Promise((r) => setTimeout(r, 10));
    });
    const boostButtons = await screen.findAllByTestId(/^train-boost-/);
    expect(boostButtons.length).toBe(7);
  });

  it("shows the fatigue impact sidebar (agotado label and -18% / -8% tiles)", async () => {
    const base = createInitialState();
    const tiredCharacter = {
      ...base.characters[0],
      fatigue: 80,
    };
    installReadyStore({
      soldier: { ...base.soldier, fatigue: 80 },
      characters: [tiredCharacter],
    });
    await act(async () => {
      render(<TrainingPage />);
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(await screen.findByText("agotado")).toBeTruthy();
    expect(await screen.findByText("-18%")).toBeTruthy();
    expect(await screen.findByText("-8%")).toBeTruthy();
  });

  it("renders the 3 recommended training suggestions", async () => {
    installReadyStore();
    await act(async () => {
      render(<TrainingPage />);
      await new Promise((r) => setTimeout(r, 10));
    });
    const recommends = await screen.findAllByTestId(/^recommend-/);
    expect(recommends.length).toBe(3);
  });

  it("calls the server action with mode=boost when the player clicks Mejorar", async () => {
    // Pica boost costs 5x baseCost = 40 coins, so the player needs a real purse.
    const base = createInitialState();
    installReadyStore({ soldier: { ...base.soldier, coins: 200 } });
    trainStatActionMock.mockResolvedValue({ ok: true, message: "+3 en Pica." });
    await act(async () => {
      render(<TrainingPage />);
      await new Promise((r) => setTimeout(r, 30));
    });
    const boostButton = await screen.findByTestId("train-boost-pike");
    expect(boostButton).not.toBeDisabled();
    await act(async () => {
      boostButton.click();
      // wait long enough for the startTransition + server action to flush
      await new Promise((r) => setTimeout(r, 60));
    });
    expect(trainStatActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ stat: "pike", mode: "boost" }),
    );
  });
});

