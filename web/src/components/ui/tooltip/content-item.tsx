"use client";

// Item tooltip body: item header, requirements, passives, modifiers vs current
// equipment, description, and price.

import { useGameStore } from "@/lib/game-store";
import { getItem, getItemImagePath } from "@/lib/data/items";
import { trainingAssetPaths } from "@/lib/data/ui-paths";
import { STAT_INFO } from "@/lib/stats";
import { passiveShortLine, rarityStyle, TRIGGER_LABEL } from "@/lib/item-format";
import { UiAssetIcon } from "../ui-asset-icon";
import type { StatId } from "@/lib/types";

const SLOT_LABEL: Record<string, string> = {
  head: "Morri\u00f3n / Cabeza",
  body: "Coraza / Cuerpo",
  mainHand: "Arma Principal",
  offHand: "Arma Secundaria",
  firearm: "Arcabuz / Distancia",
  boots: "Calzado",
  accessory: "Reliquia / Accesorio",
  consumable: "Consumible",
};

export function ItemTooltipContent({ itemId }: { itemId?: string }) {
  const { soldier } = useGameStore();
  if (!itemId) return null;
  const item = getItem(itemId);
  if (!item) return <div className="text-danger">Objeto desconocido ({itemId})</div>;

  const equippedItemId = soldier.equipment[item.slot];
  const hasComparison = Boolean(equippedItemId) && equippedItemId !== item.id;
  const equippedItem = hasComparison ? getItem(equippedItemId!) : null;

  const allStatKeys = Array.from(
    new Set([
      ...Object.keys(item.effects),
      ...(equippedItem ? Object.keys(equippedItem.effects) : []),
    ]),
  ) as StatId[];

  const rarity = rarityStyle(item.rarity);

  return (
    <div className="w-72 p-4 space-y-3">
      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 items-start pb-2.5 border-b border-iron/40">
        <div className="asset-icon-frame h-12 w-12 shrink-0 overflow-hidden rounded-xs p-1">
          <img
            src={getItemImagePath(itemId)}
            alt={item.name}
            className="asset-icon-image h-full w-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-1.5">
            <h4 className="min-w-0 flex-1 truncate font-cinzel text-sm font-bold leading-tight text-gold">
              {item.name}
            </h4>
            {item.rarity && (
              <span
                className={`shrink-0 rounded-xs border px-1 font-mono text-[8px] font-bold uppercase tracking-widest ${rarity.ring} ${rarity.color} ${rarity.bg}`}
              >
                {rarity.label}
              </span>
            )}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-text-muted mt-0.5">
            {SLOT_LABEL[item.slot] ?? item.slot}
          </p>
        </div>
      </div>

      {item.requirements && (
        <div className="text-[10px] font-mono text-amber-300 bg-amber-900/15 border border-amber-700/40 px-2 py-1 rounded-xs">
          {item.requirements.minRank && (
            <span>
              Requiere rango:{" "}
              <strong className="capitalize">{item.requirements.minRank.replace(/_/g, " ")}</strong>
            </span>
          )}
          {item.requirements.minHonor !== undefined && (
            <span className="ml-2">
              \u00b7 Honor \u2265 <strong>{item.requirements.minHonor}</strong>
            </span>
          )}
        </div>
      )}

      {item.passives && item.passives.length > 0 && (
        <div className={`${rarity.bg} border ${rarity.ring} p-2 rounded-xs space-y-1`}>
          <span className={`text-[9px] uppercase tracking-widest font-mono ${rarity.color} block`}>
            Pasivas ({item.passives.length})
          </span>
          {item.passives.map((p) => (
            <div key={p.id} className="text-[10px] font-sans text-text leading-snug">
              <span className={`font-bold ${rarity.color}`}>{p.name}</span>
              <span className="text-text-muted text-[9px] font-mono uppercase ml-1.5">
                [{TRIGGER_LABEL[p.trigger]}]
              </span>
              <div className="text-text-muted text-[10px] italic mt-0.5">
                {passiveShortLine(p)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5 font-mono text-[11px]">
        <span className="text-[9px] uppercase tracking-widest text-text-muted/70 block mb-1">
          Modificadores:
        </span>
        {allStatKeys.length === 0 ? (
          <div className="text-text-muted italic text-[10px]">Sin modificadores de atributos.</div>
        ) : (
          allStatKeys.map((key) => {
            const val = Number(item.effects[key] ?? 0);
            const eqVal = equippedItem ? Number(equippedItem.effects[key] ?? 0) : 0;
            const diff = val - eqVal;
            const statLabel = STAT_INFO[key]?.name ?? key;
            const sign = val >= 0 ? "+" : "";
            return (
              <div
                key={key}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1 border-b border-iron/10 last:border-0"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-text-muted">
                  {trainingAssetPaths[key] && (
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border border-iron/35 bg-stone-950/65 p-0.5">
                      <img
                        src={trainingAssetPaths[key]}
                        alt=""
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    </span>
                  )}
                  <span className="truncate capitalize">{statLabel}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-bold leading-none">
                  <span className={val > 0 ? "text-success" : val < 0 ? "text-danger" : "text-text"}>
                    {sign}
                    {val}
                  </span>
                  {hasComparison && diff !== 0 && (
                    <span
                      className={`text-[9px] font-bold ${
                        diff > 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      ({diff > 0 ? `+${diff}` : diff})
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs font-serif italic text-text-muted leading-relaxed border-t border-iron/20 pt-2 pb-1">
        &quot;{item.description}&quot;
      </p>

      <div className="flex justify-between items-center text-[10px] font-mono border-t border-iron/40 pt-2 text-text-muted">
        <span>Valor Sugerido</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-gold font-bold leading-none">
          <UiAssetIcon id="coins" label="" className="h-4 w-4 shrink-0" />
          <span>{item.value} dob.</span>
        </span>
      </div>
    </div>
  );
}
