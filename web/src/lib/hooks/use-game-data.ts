// useGameData: single source of truth for the page-level async state.
// Wraps useGameStore and exposes `status: "idle" | "loading" |
// "ready" | "error"`, `error`, `refetch()`, and `setError()`. Pages
// render their skeleton when status !== "ready", the ErrorState
// panel when status === "error", and the real content when status
// === "ready".
//
// The hook hydrates the client cache from /api/demo/state. The API
// currently uses the _demo bridge, which reads PostgreSQL when
// DATABASE_URL exists and falls back to the filesystem demo store in
// local development.

"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client-session";
import { useGameStore } from "@/lib/game-store";
import type { GameState } from "@/lib/types";

export type GameDataStatus = "idle" | "loading" | "ready" | "error";

export interface UseGameDataResult {
  status: GameDataStatus;
  error: unknown;
  refetch: () => void;
  setError: (error: unknown) => void;
  clearError: () => void;
}

export function useGameData(): UseGameDataResult {
  const [status, setStatus] = useState<GameDataStatus>("idle");
  const [error, setErrorState] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const hasStore = useGameStore((state) => Boolean(state.soldier));
  const hydrateState = useGameStore((state) => state.hydrateState);

  useEffect(() => {
    const controller = new AbortController();

    async function hydrateFromBackend() {
      setStatus("loading");
      setErrorState(null);

      try {
        const refreshResponse = await authFetch("/api/auth/refresh", {
          cache: "no-store",
          method: "POST",
          signal: controller.signal,
        });
        if (refreshResponse.status === 401) return;

        const response = await authFetch("/api/game/state", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          state?: GameState;
          error?: string;
        };
        if (response.status === 401) return;

        if (!response.ok || !payload.ok || !payload.state?.soldier) {
          throw new Error(payload.error ?? "No se pudo cargar la partida.");
        }

        hydrateState(payload.state);
        setStatus("ready");
      } catch (err) {
        if (controller.signal.aborted) return;
        setErrorState(err);
        setStatus("error");
      }
    }

    void hydrateFromBackend();

    return () => controller.abort();
  }, [hydrateState, reloadKey]);

  const setError = useCallback((err: unknown) => setErrorState(err), []);
  const clearError = useCallback(() => setErrorState(null), []);

  const refetch = useCallback(() => {
    setErrorState(null);
    setReloadKey((key) => key + 1);
  }, []);

  if (status === "loading") {
    return { status: "loading", error: null, refetch, setError, clearError };
  }
  if (status === "error" || error) {
    return { status: "error", error, refetch, setError, clearError };
  }
  if (!hasStore) {
    return { status: "idle", error: null, refetch, setError, clearError };
  }
  return { status: "ready", error: null, refetch, setError, clearError };
}
