// FitBadge: single source of truth for the encaja / fuera_de_rol / reserva
// indicators previously duplicated in stripe-card.tsx and inline in
// stripe-token.tsx.

import { AlertTriangle, Check } from "lucide-react";
import { Tooltip } from "./tooltip";
import type { FitState } from "@/lib/domain/formation";

const FIT_COPY: Record<FitState, { label: string; tooltip: string }> = {
  encaja: {
    label: "encaja",
    tooltip: "Su mejor stat coincide con la fila.",
  },
  fuera_de_rol: {
    label: "fuera",
    tooltip: "Su mejor stat no es el de esta fila. Cumple, pero arrastra lastre.",
  },
  banquillo: {
    label: "reserva",
    tooltip: "En reserva. Sin puesto fijo.",
  },
};

export function FitBadge({
  fit,
  isPlayer = false,
  className = "",
}: {
  fit: FitState;
  isPlayer?: boolean;
  className?: string;
}) {
  const copy = FIT_COPY[fit];
  if (fit === "encaja") {
    return (
      <Tooltip content={copy.tooltip}>
        <span
          className={`shrink-0 inline-flex items-center gap-0.5 rounded-xs border px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest transition-colors ${
            isPlayer
              ? "border-gold/55 bg-gold/15 text-gold hover:border-gold/70"
              : "border-success/40 bg-success/12 text-success hover:border-success/60"
          } ${className}`}
          aria-label="Encaja en la fila"
        >
          <Check className="h-2.5 w-2.5" />
          <span>{copy.label}</span>
        </span>
      </Tooltip>
    );
  }
  if (fit === "fuera_de_rol") {
    return (
      <Tooltip content={copy.tooltip}>
        <span
          className={`shrink-0 inline-flex items-center gap-0.5 rounded-xs border border-warning/40 bg-warning/10 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-warning transition-colors hover:border-warning/60 ${className}`}
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          <span>{copy.label}</span>
        </span>
      </Tooltip>
    );
  }
  return (
    <Tooltip content={copy.tooltip}>
      <span
        className={`shrink-0 inline-flex items-center gap-0.5 rounded-xs border border-iron/70 bg-stone-950/60 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-text-muted transition-colors hover:border-iron hover:text-text ${className}`}
      >
        <span>{copy.label}</span>
      </span>
    </Tooltip>
  );
}
