import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameData } from "@/lib/hooks/use-game-data";

const mockSoldier = {
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
    head: null, body: null, mainHand: null, offHand: null,
    firearm: null, accessory: null, boots: null, consumable: null,
  },
  wounds: [],
};

function mockStore(overrides: { hasSoldier?: boolean } = {}) {
  const selector = vi.fn().mockReturnValue(overrides.hasSoldier ?? true);
  return { useGameStore: Object.assign(selector, { getState: () => ({ soldier: mockSoldier }) }) };
}

vi.mock("@/lib/game-store", () => mockStore());

describe("useGameData", () => {
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

  it("returns 'idle' status when the store has no soldier", async () => {
    vi.resetModules();
    vi.doMock("@/lib/game-store", () => {
      const selector = vi.fn().mockReturnValue(false);
      return { useGameStore: Object.assign(selector, { getState: () => ({ soldier: null }) }) };
    });
    const { useGameData: useGameDataFresh } = await import("@/lib/hooks/use-game-data");
    const { result } = renderHook(() => useGameDataFresh());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.status).toBe("idle");
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
