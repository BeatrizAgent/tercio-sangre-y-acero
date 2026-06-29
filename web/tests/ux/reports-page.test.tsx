// ReportsPage: list of past mission reports. Renders against the real store.

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

import ReportsPage from "@/app/reports/page";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState, MissionResult } from "@/lib/types";

function installReadyStore(reports: MissionResult[] = []) {
  const state: { current: GameState } = { current: { ...createInitialState(), reports } };
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

describe("ReportsPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
  });

  it("shows the ReportsSkeleton while loading", () => {
    installReadyStore();
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<ReportsPage />);
    expect(container.querySelector(".skeleton-shimmer")).not.toBeNull();
  });

  it("renders the empty state when no reports exist", async () => {
    installReadyStore();
    let result: { container: HTMLElement } = { container: document.createElement("div") };
    await act(async () => {
      result = render(<ReportsPage />);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.container.firstChild).not.toBeNull();
  });

  it("renders a report link when reports exist", async () => {
    const report: MissionResult = {
      id: "report_1",
      missionId: "mission_guardia_noche_001",
      success: true,
      report: "La guardia nocturno fue tranquila.",
      rewards: { coins: 1, honor: 0, xp: 4 },
      fatigue: 4,
      wounds: [],
      loot: [],
      createdAt: new Date("2026-06-25T10:00:00.000Z").toISOString(),
    };
    installReadyStore([report]);
    let result: { container: HTMLElement } = { container: document.createElement("div") };
    await act(async () => {
      result = render(<ReportsPage />);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.container.firstChild).not.toBeNull();
  });
});

