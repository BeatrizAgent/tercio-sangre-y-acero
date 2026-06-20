"use client";

// Wound tooltip body: header, severity badge, description, penalty, attributes
// drained, and recommended treatment items.

import { getWound } from "@/lib/game-data";
import { STAT_INFO } from "@/lib/stats";
import type { StatId } from "@/lib/types";

const SEVERITY_LABEL: Record<number, string> = {
  1: "I (Leve)",
  2: "II (Moderada)",
  3: "III (Grave)",
  4: "IV (Infectada)",
};

export function WoundTooltipContent({
  woundId,
  treated = false,
}: {
  woundId?: string;
  treated?: boolean;
}) {
  if (!woundId) return null;
  const woundDef = getWound(woundId);
  if (!woundDef) return <div className="text-danger">Herida desconocida ({woundId})</div>;

  return (
    <div className="w-64 p-4 space-y-2.5">
      <div className="pb-1.5 border-b border-iron/40 flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h4 className="font-cinzel font-bold text-gold-soft text-sm truncate leading-tight capitalize">
            {woundDef.name}
          </h4>
          <p className="font-mono text-[9px] uppercase tracking-wider text-text-muted mt-0.5">
            Gravedad: {SEVERITY_LABEL[woundDef.severity] ?? woundDef.severity}
          </p>
        </div>
        <span
          className={`font-mono text-[9px] font-bold uppercase border px-1.5 py-0.5 rounded-xs shrink-0 ${
            treated
              ? "border-success/30 bg-success/15 text-success"
              : "border-danger/30 bg-danger/15 text-danger animate-pulse"
          }`}
        >
          {treated ? "Tratada" : "Abierta"}
        </span>
      </div>

      <p className="text-xs font-serif italic text-text-muted leading-relaxed">
        &quot;{woundDef.description}&quot;
      </p>

      <div className="font-mono text-[10px] space-y-1 pt-1.5 border-t border-iron/20">
        <div className="flex justify-between items-center">
          <span className="text-text-muted">Penalizaci\u00f3n Actual:</span>
          <span className={`font-bold ${treated ? "text-success" : "text-danger"}`}>
            {treated ? "Ninguna (Cicatriza)" : "-2 en Combate"}
          </span>
        </div>

        {!treated && woundDef.effects && Object.keys(woundDef.effects).length > 0 && (
          <div className="bg-danger/5 border border-danger/10 p-1.5 rounded-xs mt-1.5">
            <span className="text-[9px] text-danger/80 block uppercase mb-0.5">
              Drenaje de Atributo:
            </span>
            {Object.entries(woundDef.effects).map(([key, val]) => (
              <div
                key={key}
                className="flex justify-between text-[10px] text-danger font-semibold"
              >
                <span className="capitalize">{STAT_INFO[key as StatId]?.name ?? key}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!treated && woundDef.treatmentItems && (
        <div className="font-mono text-[10px] border-t border-iron/20 pt-2 space-y-1">
          <span className="text-text-muted block text-[9px] uppercase tracking-wider">
            Tratamiento Recomendado:
          </span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {woundDef.treatmentItems.map((item: string) => (
              <span
                key={item}
                className="bg-stone-900 border border-iron/60 px-1.5 py-0.5 text-gold-soft rounded-xs text-[9px] font-bold"
              >
                {item === "objeto_002" || item === "clean_bandage"
                  ? "Venda de lino"
                  : item === "wine_skin"
                    ? "Odre de Vino"
                    : item}
              </span>
            ))}
            {woundDef.treatmentItems.length === 0 && (
              <span className="text-muted italic">Reposo natural en camastro</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
