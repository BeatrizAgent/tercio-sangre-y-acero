// useOptimisticAction: snapshot + optimistic update + rollback for
// store mutations. Use this for the "instant-feel" flows where the
// user expects the UI to react immediately (train, buy, equip).
//
// Pattern:
//   const { run, pending } = useOptimisticAction(
//     buyItemAction,
//     (state, itemId) => buyItemInState(state, itemId),
//   );
//
//   await run({ itemId: "pike_001" });   // -> store mutates immediately
//                                        //    on failure: rolls back + toast
//
// The `apply` function is the same pure domain function used by the
// store today, so the optimistic value matches what the action
// would have produced on the server (assuming non-deterministic
// branches use the same seed when the swap happens).

"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { useGameStore } from "@/lib/game-store";
import type { GameState } from "@/lib/types";
import type { ActionResult } from "@/lib/domain/result";

export type OptimisticApply<T> = (state: GameState, args: T) => GameState;

export interface OptimisticActionOptions<T> {
  successMessage?: (result: ActionResult<unknown>, args: T) => string;
  onSuccess?: (result: ActionResult<unknown>, args: T) => void;
  onError?: (reason: string, args: T) => void;
}

export function useOptimisticAction<T>(
  serverAction: (args: T) => Promise<void | ActionResult<unknown>>,
  apply: OptimisticApply<T>,
  options: OptimisticActionOptions<T> = {},
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    (args: T) => {
      setError(null);
      startTransition(async () => {
        const before = useGameStore.getState();
        const snapshot = before as unknown as GameState;
        const optimistic = apply(snapshot, args);
        if (optimistic !== snapshot) {
          useGameStore.setState(optimistic as Partial<GameState>);
        }
        try {
          const result = (await serverAction(args)) as ActionResult<unknown> | void;
          if (result && result.ok === false) {
            useGameStore.setState(snapshot as Partial<GameState>);
            setError(result.message);
            toast.error(result.message);
            options.onError?.(result.message, args);
            return;
          }
          if (result && options.successMessage) {
            toast.success(options.successMessage(result, args));
          }
          if (result) options.onSuccess?.(result, args);
        } catch (err) {
          useGameStore.setState(snapshot as Partial<GameState>);
          const message = err instanceof Error ? err.message : "Accion rechazada por el campamento.";
          setError(message);
          toast.error(message);
          options.onError?.(message, args);
        }
      });
    },
    [apply, options, serverAction],
  );

  return { run, pending, error };
}
