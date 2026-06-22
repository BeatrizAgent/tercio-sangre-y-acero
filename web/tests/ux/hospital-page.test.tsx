import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const { useGameDataMock, useGameStoreMock } = vi.hoisted(() => {
  const useGameDataMock = vi.fn();
  const useGameStoreMock = vi.fn();
  return { useGameDataMock, useGameStoreMock };
});

vi.mock("@/lib/hooks/use-game-data", () => ({ useGameData: useGameDataMock }));
vi.mock("@/lib/game-store", () => ({ useGameStore: useGameStoreMock }));

import HospitalPage from "@/app/hospital/page";

function baseStore() {
  return {
    soldier: {
      id: "diego_de_arce",
      name: "Diego de Arce",
      rank: "bisono",
      coins: 25,
      honor: 0,
      fatigue: 30,
      unpaidWages: 0,
      reputation: 0,
      corruption: 0,
      banMissionsLeft: 0,
      stats: { pike: 2, sword: 1, arquebus: 1, discipline: 2, vigor: 2, cunning: 1, command: 0 },
      inventory: [],
      equipment: {
        head: null, body: null, mainHand: null, offHand: null,
        firearm: null, accessory: null, boots: null, consumable: null,
      },
      wounds: [],
    },
    treatWound: vi.fn().mockReturnValue({ ok: true, message: "Herida vendada." }),
    payTownBribe: vi.fn().mockReturnValue({ ok: true, message: "Soborno aceptado." }),
  };
}

describe("HospitalPage", () => {
  beforeEach(() => {
    useGameDataMock.mockReset();
    useGameStoreMock.mockReset();
    useGameStoreMock.mockImplementation((selector?: (s: ReturnType<typeof baseStore>) => unknown) =>
      selector ? selector(baseStore()) : baseStore(),
    );
  });

  it("renders the HospitalSkeleton while loading", () => {
    useGameDataMock.mockReturnValue({
      status: "loading",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<HospitalPage />);
    expect(container.querySelector(".skeleton-shimmer")).not.toBeNull();
  });

  it("renders the resting panel when ready", async () => {
    useGameDataMock.mockReturnValue({
      status: "ready",
      error: null,
      refetch: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
    });
    const { container } = render(<HospitalPage />);
    // The page has its own `mounted` flag that flips after a setTimeout(0).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(container.querySelector(".skeleton-shimmer")).toBeNull();
    // The page has buttons to rest and treat wounds.
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
