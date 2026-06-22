// useGameData: single source of truth for the page-level async state.
// Wraps useGameStore and exposes `status: "idle" | "loading" |
// "ready" | "error"`, `error`, `refetch()`, and `setError()`. Pages
// render their skeleton when status !== "ready", the ErrorState
// panel when status === "error", and the real content when status
// === "ready".
//
// Today the demo store is synchronous-ish (loads from
// localStorage on the client), so the hook resolves to "ready"
// almost immediately. When lib/actions/_demo.ts is swapped for a
// real lib/api/* client, the same hook gives every page a free
// "loading" window without touching the page code.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";

export type GameDataStatus = "idle" | "loading" | "ready" | "error";

export interface UseGameDataResult {
  status: GameDataStatus;
  error: unknown;
  refetch: () => void;
  setError: (error: unknown) => void;
  clearError: () => void;
}

export function useGameData(): UseGameDataResult {
  const [mounted, setMounted] = useState(false);
  const [error, setErrorState] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const hasStore = useGameStore((state) => Boolean(state.soldier));

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setError = useCallback((err: unknown) => setErrorState(err), []);
  const clearError = useCallback(() => setErrorState(null), []);

  const refetch = useCallback(() => {
    setErrorState(null);
    setReloadKey((key) => key + 1);
  }, []);

  if (!mounted) {
    return { status: "loading", error: null, refetch, setError, clearError };
  }
  if (error) {
    return { status: "error", error, refetch, setError, clearError };
  }
  if (!hasStore) {
    return { status: "idle", error: null, refetch, setError, clearError };
  }
  // reloadKey is here so consumers that want to manually re-trigger
  // a fetch (e.g. after a server action) can call refetch().
  void reloadKey;
  return { status: "ready", error: null, refetch, setError, clearError };
}
