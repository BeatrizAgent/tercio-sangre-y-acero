// ErrorState: paired with useGameData().status === "error".
// Provides a recoverable UI with an optional retry callback so a
// failing backend request can be re-issued from the same panel.

import { RefreshCw, Skull } from "lucide-react";
import { UiAssetIcon } from "./ui-asset-icon";
import type { ComponentProps } from "react";

type UiIconId = ComponentProps<typeof UiAssetIcon>["id"];

export function ErrorState({
  title = "Algo ha fallado en el campamento",
  description = "No hemos podido leer los datos del servidor. Comprueba la conexion e intentalo de nuevo.",
  error,
  onRetry,
  retryLabel = "Reintentar",
  icon,
  className = "",
}: {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: UiIconId;
  className?: string;
}) {
  const detail = extractMessage(error);
  return (
    <div
      role="alert"
      className={`game-panel flex flex-col items-center gap-3 rounded-xs border border-danger/45 bg-danger/5 p-6 text-center ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xs border border-danger/55 bg-danger/15 text-danger">
        {icon ? (
          <UiAssetIcon id={icon} label={title} className="h-7 w-7" />
        ) : (
          <Skull className="h-7 w-7" aria-hidden="true" />
        )}
      </span>
      <p className="font-cinzel text-base font-bold uppercase tracking-wider text-danger">
        {title}
      </p>
      {description && (
        <p className="max-w-md text-sm text-text-muted">{description}</p>
      )}
      {detail && (
        <p className="max-w-md font-mono text-[11px] text-danger/80">{detail}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 border border-danger/55 bg-danger/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-danger transition hover:bg-danger/20"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

function extractMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const value = (error as { message: unknown }).message;
    if (typeof value === "string") return value;
  }
  return null;
}
