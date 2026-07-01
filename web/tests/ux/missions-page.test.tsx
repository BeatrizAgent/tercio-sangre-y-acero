// Missions flow: list + detail. Renders against the real GameState store.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";

const { useGameDataMock, useGameStoreMock, replaceMock, pushMock, paramsMock, searchParamsMock } = vi.hoisted(() => ({
  useGameDataMock: vi.fn(),
  useGameStoreMock: vi.fn(),
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
  paramsMock: vi.fn(),
  searchParamsMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useParams: paramsMock,
  useSearchParams: searchParamsMock,
}));
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import MissionsPage from "@/app/missions/page";
import MissionDetailPage from "@/app/missions/[id]/page";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState } from "@/lib/types";

function installReadyStore(overrides: Partial<GameState> = {}) {
  let base = createInitialState();
  base = { ...base, ...overrides };
  if (overrides.soldier) {
    base = { ...base, soldier: { ...base.soldier, ...overrides.soldier } };
  }
  const state: { current: GameState } = { current: base };
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
  useGameDataMock.mockReturnValue({
    status: "ready",
    error: null,
    refetch: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
  });
  return state;
}

describe("missions flow", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
    replaceMock.mockReset();
    pushMock.mockReset();
    paramsMock.mockReset();
    searchParamsMock.mockReset();
  });

  it("opens a ready boss and links to the mission detail", () => {
    installReadyStore();
    searchParamsMock.mockReturnValue(new URLSearchParams("region=flandes&boss=flandes_boss_1"));
    render(<MissionsPage />);

    const deploy = screen.getByRole("link", { name: /Desplegar/ });
    expect(deploy).toHaveAttribute("href", "/missions/mission_patrulla_flandes_001");
  });

  it("renders story mode from the URL", () => {
    installReadyStore();
    searchParamsMock.mockReturnValue(new URLSearchParams("mode=story&region=flandes&boss=flandes_boss_1"));
    render(<MissionsPage />);

    expect(screen.getByText("Modo historia")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /Casa de tierra y humo/ })).toBeInTheDocument();
    expect(screen.getByText("Capitulo 1: La leva de Castilla")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Desplegar/ })).not.toBeInTheDocument();
  });

  it("renders chapter 2 as a simple choice chapter (no puzzle)", () => {
    installReadyStore({
      storyProgress: {
        arcId: "prologue_castilla",
        currentChapterId: "cap1_recuerdo_madre",
        completedChapterIds: ["cap1_choza_castellana"],
        choices: { cap1_choza_castellana: "shield_brother" },
      },
    });
    searchParamsMock.mockReturnValue(new URLSearchParams("mode=story"));
    render(<MissionsPage />);

    expect(screen.getByRole("dialog", { name: /El pan de la madre/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Saltar/ }));
    expect(screen.getByRole("button", { name: /Canturrear bajo/ })).toBeEnabled();
    expect(screen.queryByText(/Ordena los recuerdos/)).not.toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("shows campaign as the default mode", () => {
    installReadyStore();
    searchParamsMock.mockReturnValue(new URLSearchParams(""));
    render(<MissionsPage />);

    expect(screen.getByRole("heading", { name: /Mapa de campaña/ })).toBeInTheDocument();
  });

  it("renders the mission detail start button", () => {
    installReadyStore();
    paramsMock.mockReturnValue({ id: "mission_patrulla_flandes_001" });
    render(<MissionDetailPage />);

    expect(screen.getByRole("button", { name: /Iniciar misi/ })).toBeInTheDocument();
  });
});
