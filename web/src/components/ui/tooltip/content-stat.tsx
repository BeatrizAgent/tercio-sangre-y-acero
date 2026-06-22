"use client";

// Stat tooltip body: header, description, and a base/equipment/total math
// breakdown sourced from the game store.

import { useGameStore } from "@/lib/game-store";
import { getEquipmentBonuses } from "@/lib/game-data";
import { STAT_INFO } from "@/lib/stats";
import type { StatId } from "@/lib/types";

export function StatTooltipContent({ statId }: { statId?: StatId }) {
  // Hooks must run before any early return.
  const { soldier } = useGameStore();

  if (!statId) return null;
  const details = STAT_INFO[statId];
  if (!details) {
    return <div className="text-danger">Atributo desconocido ({statId})</div>;
  }

  const baseVal = soldier.stats[statId] ?? 0;
  const bonuses = getEquipmentBonuses(soldier.equipment);
  const equipVal = bonuses[statId] ?? 0;
  const totalVal = baseVal + equipVal;

  return (
    <div className="w-64 p-4 space-y-2.5">
      <div className="pb-1.5 border-b border-iron/40 flex justify-between items-center">
        <h4 className="font-cinzel font-bold text-gold uppercase text-sm tracking-wider">
          {details.name}
        </h4>
        <span className="font-mono font-bold text-sm text-gold-soft">{totalVal}</span>
      </div>

      <p className="text-xs text-text-muted leading-relaxed font-sans">{details.description}</p>

      <div className="font-mono text-[10px] text-text-muted space-y-0.5 pt-1.5 border-t border-iron/20">
        <div className="flex justify-between">
          <span>Valor Base:</span>
          <span className="text-text font-bold">{baseVal}</span>
        </div>
        <div className="flex justify-between">
          <span>Por Equipo:</span>
          <span className="text-success font-bold">+{equipVal}</span>
        </div>
        <div className="flex justify-between border-t border-iron/10 pt-1 mt-1 font-bold">
          <span className="text-gold-soft">Fuerza Total:</span>
          <span className="text-gold-soft">{totalVal}</span>
        </div>
      </div>
    </div>
  );
}
