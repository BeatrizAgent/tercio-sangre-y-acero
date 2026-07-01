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
  head: "Morrión / Cabeza",
  body: "Coraza / Cuerpo",
  mainHand: "Arma Principal",
  offHand: "Arma Secundaria",
  firearm: "Arcabuz / Distancia",
  boots: "Calzado",
  accessory: "Reliquia / Accesorio",
  consumable: "Consumible",
};

const EFFECT_LABEL: Record<string, string> = {
  armor: "Armadura",
  Armor: "Armadura",
  damageMin: "Daño min.",
  DamageMin: "Daño min.",
  damageMax: "Daño max.",
  DamageMax: "Daño max.",
  honor: "Honor",
  fatigue: "Fatiga",
  woundTreatment: "Cura",
  coins_pct: "Botín",
  chance: "Prob.",
  duration: "Duración",
};

function isStatId(key: string): key is StatId {
  return key in STAT_INFO;
}

function effectLabel(key: string): string {
  if (isStatId(key)) return STAT_INFO[key].name;
  return EFFECT_LABEL[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function ItemTooltipContent({ itemId }: { itemId?: string }) {
  const { soldier } = useGameStore();
  if (!itemId) return null;
  const item = getItem(itemId);
  if (!item) return <div className="text-danger">Objeto desconocido ({itemId})</div>;

  const equippedItemId = soldier.equipment[item.slot];
  const hasComparison = Boolean(equippedItemId) && equippedItemId !== item.id;
  const equippedItem = hasComparison ? getItem(equippedItemId!) : null;
  const itemEffects = item.effects as Record<string, number | undefined>;
  const equippedEffects = (equippedItem?.effects ?? {}) as Record<string, number | undefined>;

  const allStatKeys = Array.from(
    new Set([
      ...Object.keys(itemEffects),
      ...(equippedItem ? Object.keys(equippedEffects) : []),
    ]),
  );

  const rarity = rarityStyle(item.rarity);

  return (
    <div className="tooltip-item-panel space-y-2.5 p-3">
      <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2.5 items-start pb-2 border-b border-iron/40">
        <div className="asset-icon-frame h-11 w-11 shrink-0 overflow-hidden rounded-xs p-1">
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
        <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 rounded-xs border border-amber-700/40 bg-amber-900/15 px-2 py-1 font-mono text-[10px] leading-snug text-amber-300">
          {item.requirements.minRank && (
            <span className="min-w-0 truncate">
              Requiere rango:{" "}
              <strong className="capitalize">{item.requirements.minRank.replace(/_/g, " ")}</strong>
            </span>
          )}
          {item.requirements.minHonor !== undefined && (
            <span className="min-w-0 truncate">
              · Honor ≥ <strong>{item.requirements.minHonor}</strong>
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
            <div key={p.id} className="min-w-0 text-[10px] font-sans text-text leading-snug">
              <span className={`font-bold ${rarity.color}`}>{p.name}</span>
              <span className="ml-1.5 font-mono text-[9px] uppercase text-text-muted">
                [{TRIGGER_LABEL[p.trigger]}]
              </span>
              <div className="mt-0.5 line-clamp-2 text-[10px] italic text-text-muted">
                {passiveShortLine(p)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 font-mono text-[10px]">
        <span className="text-[9px] uppercase tracking-widest text-text-muted/70 block mb-1">
          Modificadores:
        </span>
        {allStatKeys.length === 0 ? (
          <div className="text-text-muted italic text-[10px]">Sin modificadores de atributos.</div>
        ) : (
          allStatKeys.map((key) => {
            const val = Number(itemEffects[key] ?? 0);
            const eqVal = equippedItem ? Number(equippedEffects[key] ?? 0) : 0;
            const diff = val - eqVal;
            const statLabel = effectLabel(key);
            const sign = val >= 0 ? "+" : "";
            return (
              <div
                key={key}
                className="grid min-h-6 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-iron/10 py-0.5 last:border-0"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-text-muted">
                  {isStatId(key) && trainingAssetPaths[key] && (
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border border-iron/35 bg-stone-950/65 p-0.5">
                      <img
                        src={trainingAssetPaths[key]}
                        alt=""
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    </span>
                  )}
                  <span className="truncate">{statLabel}</span>
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

      <p className="line-clamp-3 border-t border-iron/20 pt-2 pb-0.5 font-serif text-xs italic leading-relaxed text-text-muted">
        &quot;{item.description}&quot;
      </p>

      <div className="flex min-w-0 items-center justify-between gap-2 border-t border-iron/40 pt-2 font-mono text-[10px] text-text-muted">
        <span className="truncate">Valor Sugerido</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-gold font-bold leading-none">
          <UiAssetIcon id="coins" label="" className="h-4 w-4 shrink-0" />
          <span>{item.value} dob.</span>
        </span>
      </div>
    </div>
  );
}
