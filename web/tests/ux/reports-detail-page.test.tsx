// ReportDetailPage: shows one past mission report. Renders against the
// real GameState store.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import type React from "react";

const { useGameDataMock, useGameStoreMock, paramsMock } = vi.hoisted(() => ({
  useGameDataMock: vi.fn(),
  useGameStoreMock: vi.fn(),
  paramsMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));
vi.mock("next/navigation", () => ({ useParams: paramsMock }));
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import ReportDetailPage from "@/app/reports/[id]/page";
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

describe("ReportDetailPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
    paramsMock.mockReset();
  });

  it("renders without throwing when report id is provided", async () => {
    installReadyStore();
    paramsMock.mockReturnValue({ id: "report_xyz" });
    const { container } = render(<ReportDetailPage />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(container.firstChild).not.toBeNull();
  });
});
