import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useServerAction } from "@/lib/hooks/use-server-action";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));

describe("useServerAction", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("calls the action with the provided args", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } });
    const { result } = renderHook(() => useServerAction(action));
    await act(async () => {
      result.current.run({ itemId: "pica_001" });
    });
    expect(action).toHaveBeenCalledWith({ itemId: "pica_001" });
  });

  it("reports success via toast and onSuccess when ok=true", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useServerAction<[{ itemId: string }], { id: number }>(action, {
        successMessage: (data) => `Comprado ${data.id}`,
        onSuccess,
      }),
    );
    await act(async () => {
      result.current.run({ itemId: "pica_001" });
    });
    expect(toast.success).toHaveBeenCalledWith("Comprado 1");
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
  });

  it("reports failure via toast and onError when ok=false", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, message: "Sin monedas" });
    const onError = vi.fn();
    const { result } = renderHook(() => useServerAction(action, { onError }));
    await act(async () => {
      result.current.run({ itemId: "pica_001" });
    });
    expect(toast.error).toHaveBeenCalledWith("Sin monedas");
    expect(onError).toHaveBeenCalledWith("Sin monedas");
  });

  it("catches thrown errors and reports them", async () => {
    const action = vi.fn().mockRejectedValue(new Error("red caida"));
    const { result } = renderHook(() => useServerAction(action));
    await act(async () => {
      result.current.run({ itemId: "pica_001" });
    });
    expect(toast.error).toHaveBeenCalledWith("red caida");
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("uses the default message for non-Error throws", async () => {
    const action = vi.fn().mockRejectedValue("string error");
    const { result } = renderHook(() => useServerAction(action));
    await act(async () => {
      result.current.run({ itemId: "pica_001" });
    });
    expect(toast.error).toHaveBeenCalledWith("string error");
  });

  it("clears the previous error before running", async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, message: "primera falla" })
      .mockResolvedValueOnce({ ok: true, data: null });
    const { result } = renderHook(() => useServerAction(action));
    await act(async () => {
      result.current.run();
    });
    expect(result.current.error).toBe("primera falla");
    await act(async () => {
      result.current.run();
    });
    expect(result.current.error).toBeNull();
  });
});
