import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type React from "react";
import { createInitialState } from "@/lib/domain/initial-state";
import type { GameState } from "@/lib/types";

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

function installReadyStore() {
  const state = createInitialState();
  useGameDataMock.mockReturnValue({
    status: "ready",
    error: null,
    refetch: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
  });
  useGameStoreMock.mockImplementation((selector?: (state: GameState & Record<string, unknown>) => unknown) => {
    const store = {
      ...state,
      startMission: vi.fn().mockReturnValue({ ok: true, data: { reportId: "r1" } }),
      resolveActiveEventChoice: vi.fn(),
      activeEvent: null,
    };
    return selector ? selector(store) : store;
  });
}

describe("missions flow", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
    replaceMock.mockReset();
    pushMock.mockReset();
    paramsMock.mockReset();
    searchParamsMock.mockReset();
    installReadyStore();
  });

  it("opens a ready boss and links to the mission detail", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("region=flandes&boss=flandes_boss_1"));
    render(<MissionsPage />);

    const deploy = screen.getByRole("link", { name: /Desplegar/ });
    expect(deploy).toHaveAttribute("href", "/missions/mission_patrulla_flandes_001");
  });

  it("renders the mission detail start button", () => {
    paramsMock.mockReturnValue({ id: "mission_patrulla_flandes_001" });
    render(<MissionDetailPage />);

    expect(screen.getByRole("button", { name: /Iniciar misi/ })).toBeInTheDocument();
  });
});
