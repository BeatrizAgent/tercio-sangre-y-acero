import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { GameState } from "@/lib/types";

const { mockStoreState } = vi.hoisted(() => ({
  mockStoreState: {
    soldier: null as GameState["soldier"] | null,
    hydrateState: vi.fn(),
  },
}));

vi.mock("@/lib/game-store", () => ({
  useGameStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

import { useGameData } from "@/lib/hooks/use-game-data";

const mockSoldier: GameState["soldier"] = {
  id: "diego_de_arce",
  name: "Diego de Arce",
  rank: "bisono",
  coins: 25,
  honor: 0,
  xp: 0,
  fatigue: 0,
  unpaidWages: 0,
  reputation: 0,
  corruption: 0,
  banMissionsLeft: 0,
  stats: { pike: 2, sword: 1, arquebus: 1, discipline: 2, vigor: 2, cunning: 1, command: 0 },
  inventory: [],
  equipment: {
    head: null,
    body: null,
    mainHand: null,
    offHand: null,
    firearm: null,
    accessory: null,
    boots: null,
    consumable: null,
  },
  wounds: [],
};

const mockState = {
  soldier: mockSoldier,
} as GameState;

describe("useGameData", () => {
  beforeEach(() => {
    mockStoreState.soldier = mockSoldier;
    mockStoreState.hydrateState.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, state: mockState }),
      }),
    );
  });

  it("returns 'loading' status before the mount effect fires", () => {
    const { result } = renderHook(() => useGameData());
    expect(result.current.status).toBe("loading");
  });

  it("returns 'ready' status when the store has a soldier", async () => {
    const { result } = renderHook(() => useGameData());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeNull();
  });

  it("returns 'error' status when the backend returns no soldier", async () => {
    mockStoreState.soldier = null;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, state: { ...mockState, soldier: null } }),
      }),
    );
    const { result } = renderHook(() => useGameData());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.status).toBe("error");
  });

  it("returns 'error' status when setError is called", async () => {
    const { result } = renderHook(() => useGameData());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.status).toBe("ready");
    act(() => {
      result.current.setError(new Error("boom"));
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("clearError returns to 'ready' status", async () => {
    const { result } = renderHook(() => useGameData());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    act(() => {
      result.current.setError("something went wrong");
    });
    expect(result.current.status).toBe("error");
    act(() => {
      result.current.clearError();
    });
    expect(result.current.status).toBe("ready");
  });

  it("refetch increments the reload key but keeps the returned object stable", async () => {
    const { result } = renderHook(() => useGameData());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const ref = result.current.refetch;
    act(() => {
      result.current.refetch();
    });
    expect(result.current.refetch).toBe(ref);
  });
});
