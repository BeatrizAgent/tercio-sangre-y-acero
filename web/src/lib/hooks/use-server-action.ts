// useServerAction: thin wrapper around any lib/actions/* server
// action. Surfaces a `pending` boolean from useTransition and
// surfaces success/failure via sonner toasts. Use this for any
// action that does NOT need optimistic UI (e.g. one-shot
// admin commands, mission resolution, hospital treat).
//
// For instant-feel flows (train, buy, equip) prefer
// useOptimisticAction instead.

"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

export interface ServerActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
}

export type ServerActionFn<Args extends unknown[], T> = (
  ...args: Args
) => Promise<ServerActionResult<T>>;

export function useServerAction<Args extends unknown[], T>(
  action: ServerActionFn<Args, T>,
  options?: {
    successMessage?: (data: T) => string;
    errorMessage?: (err: unknown) => string;
    onSuccess?: (data: T) => void;
    onError?: (err: unknown) => void;
  },
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<T | undefined>(undefined);

  const run = useCallback(
    (...args: Args) => {
      setError(null);
      startTransition(async () => {
        try {
          const result = await action(...args);
          if (!result.ok) {
            const message = result.message ?? "Accion rechazada por el campamento.";
            setError(message);
            toast.error(message);
            options?.onError?.(message);
            return;
          }
          if (result.data !== undefined) setData(result.data);
          if (options?.successMessage && result.data !== undefined) {
            toast.success(options.successMessage(result.data));
          }
          options?.onSuccess?.(result.data as T);
        } catch (err) {
          setError(err);
          const message = options?.errorMessage?.(err) ?? describeError(err);
          toast.error(message);
          options?.onError?.(err);
        }
      });
    },
    [action, options],
  );

  return { run, pending, error, data };
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "La accion ha fallado en el campamento.";
}
