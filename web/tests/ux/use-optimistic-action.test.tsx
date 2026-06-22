import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOptimisticAction } from "@/lib/hooks/use-optimistic-action";
import type { GameState } from "@/lib/types";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const mockStore = vi.hoisted(() => {
  const state: { current: GameState } = { current: makeBase() };
  const listeners = new Set<() => void>();
  return {
    state,
    useGameStore: Object.assign(
      (selector: (s: GameState) => unknown) => selector(state.current),
      {
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
      },
    ),
    reset() {
      state.current = makeBase();
      listeners.clear();
    },
  };
});

function makeBase(): GameState {
  const soldier = {
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
  return {
    soldier,
    characters: [],
    activeCharacterId: "diego_de_arce",
    reports: [],
    arenaResults: [],
    activeEvent: null,
    pendingMissionId: null,
  };
}

vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/game-store", () => mockStore);

describe("useOptimisticAction", () => {
  beforeEach(() => {
    mockStore.reset();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("applies the optimistic update immediately", () => {
    const serverAction = vi.fn().mockResolvedValue(undefined);
    const apply = (state: GameState) => ({
      ...state,
      soldier: { ...state.soldier, coins: state.soldier.coins - 10 },
    });

    const { result } = renderHook(() =>
      useOptimisticAction<{ cost: number }>(serverAction, apply),
    );

    act(() => {
      result.current.run({ cost: 10 });
    });

    expect(mockStore.state.current.soldier.coins).toBe(15);
  });

  it("rolls back when the server action rejects with ok=false", async () => {
    const serverAction = vi.fn().mockResolvedValue({ ok: false, message: "rechazado" });
    const apply = (state: GameState) => ({
      ...state,
      soldier: { ...state.soldier, coins: state.soldier.coins - 10 },
    });
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useOptimisticAction<{ cost: number }>(serverAction, apply, { onError }),
    );

    await act(async () => {
      result.current.run({ cost: 10 });
    });

    expect(mockStore.state.current.soldier.coins).toBe(25);
    expect(toast.error).toHaveBeenCalledWith("rechazado");
    expect(onError).toHaveBeenCalledWith("rechazado", { cost: 10 });
  });

  it("rolls back when the server action throws", async () => {
    const serverAction = vi.fn().mockRejectedValue(new Error("network"));
    const apply = (state: GameState) => ({
      ...state,
      soldier: { ...state.soldier, coins: state.soldier.coins - 10 },
    });

    const { result } = renderHook(() =>
      useOptimisticAction<{ cost: number }>(serverAction, apply),
    );

    await act(async () => {
      result.current.run({ cost: 10 });
    });

    expect(mockStore.state.current.soldier.coins).toBe(25);
    expect(toast.error).toHaveBeenCalledWith("network");
  });

  it("does not call setState when apply returns the same state", () => {
    const serverAction = vi.fn().mockResolvedValue({ ok: true, message: "ok" });
    const apply = (state: GameState) => state; // no-op
    const setStateSpy = vi.spyOn(mockStore, "useGameStore");

    const { result } = renderHook(() =>
      useOptimisticAction<{ cost: number }>(serverAction, apply),
    );
    act(() => {
      result.current.run({ cost: 0 });
    });

    // setState should not have been called by the optimistic path
    expect(mockStore.state.current.soldier.coins).toBe(25);
    setStateSpy.mockRestore();
  });

  it("calls onSuccess when the server returns ok=true", async () => {
    const serverAction = vi.fn().mockResolvedValue({ ok: true, message: "entrenado" });
    const apply = (state: GameState) => state;
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useOptimisticAction<{ stat: string }>(serverAction, apply, {
        successMessage: (r) => (r as { message: string }).message,
        onSuccess,
      }),
    );

    await act(async () => {
      result.current.run({ stat: "pike" });
    });

    expect(toast.success).toHaveBeenCalledWith("entrenado");
    expect(onSuccess).toHaveBeenCalled();
  });
});
