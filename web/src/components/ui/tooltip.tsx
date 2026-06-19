"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { useGameStore } from "@/lib/game-store";
import { getItem, getItemImagePath, getWound, getEquipmentBonuses } from "@/lib/game-data";
import { UiAssetIcon } from "../game/ui-asset-icon";
import type { StatId } from "@/lib/types";
import { passiveShortLine, rarityStyle, TRIGGER_LABEL } from "@/lib/item-format";

const statInfo: Record<StatId, { name: string; description: string }> = {
  pike: { name: "Pica", description: "Alcance en formación, resistencia al impacto y empuje de la línea." },
  sword: { name: "Espada", description: "Combate a corta distancia y violencia cuando la línea se rompe." },
  arquebus: { name: "Arcabuz", description: "Manejo de armas de fuego bajo el humo, el viento y la lluvia." },
  discipline: { name: "Disciplina", description: "Mantener la formación, obedecer órdenes y superar el pánico." },
  vigor: { name: "Vigor", description: "Marcha con peso, aguante físico, curación de heridas y encajar golpes." },
  cunning: { name: "Astucia", description: "Detectar peligros, esquivar la muerte y ver oportunidades." },
  command: { name: "Mando", description: "Autoridad sobre otros soldados y moral de la compañía." },
};

export type TooltipType = "simple" | "item" | "stat" | "wound";

interface TooltipProps {
  children?: React.ReactNode;
  type?: TooltipType;
  content?: string; // For type="simple"
  itemId?: string; // For type="item"
  statId?: StatId; // For type="stat"
  woundId?: string; // For type="wound"
  treated?: boolean; // For type="wound"
}

export function Tooltip({
  children,
  type = "simple",
  content = "",
  itemId,
  statId,
  woundId,
  treated = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom" | "left" | "right">("top");
  const containerRef = useRef<HTMLDivElement>(null);
  const { soldier } = useGameStore();

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      // Choose side with most space, prioritize top, then bottom, then right, then left
      if (spaceAbove > 340) {
        setPosition("top");
      } else if (spaceBelow > 340) {
        setPosition("bottom");
      } else if (spaceRight > 320) {
        setPosition("right");
      } else {
        setPosition("left");
      }
    }
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  // Mobile device tap safety
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      if (!visible) {
        // Prevent click action on children and show tooltip
        e.stopPropagation();
        e.preventDefault();
        handleMouseEnter();
      }
    }
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!visible) return;
    const handleOutsideClick = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [visible]);

  // Position CSS classes mapping
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
    left: "right-full top-1/2 -translate-y-1/2 mr-3",
    right: "left-full top-1/2 -translate-y-1/2 ml-3",
  };

  // Render tooltip contents depending on type
  const renderContent = () => {
    switch (type) {
      case "item": {
        if (!itemId) return null;
        const item = getItem(itemId);
        if (!item) return <div className="text-danger">Objeto desconocido ({itemId})</div>;

        const equippedItemId = soldier.equipment[item.slot];
        const hasComparison = equippedItemId && equippedItemId !== item.id;
        const equippedItem = hasComparison ? getItem(equippedItemId) : null;

        // Stat list combining hovered and equipped
        const allStatKeys = Array.from(
          new Set([...Object.keys(item.effects), ...(equippedItem ? Object.keys(equippedItem.effects) : [])])
        ) as StatId[];

        return (
          <div className="w-72 p-4 space-y-3">
            {/* Header */}
            <div className="flex gap-3 items-start pb-2.5 border-b border-iron/40">
              <div className="h-12 w-12 shrink-0 overflow-hidden border border-iron bg-stone-900/90 rounded-xs flex items-center justify-center p-1">
                <img
                  src={getItemImagePath(itemId)}
                  alt={item.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-cinzel font-bold text-gold text-sm truncate leading-tight">{item.name}</h4>
                  {item.rarity && (
                    <span
                      className={`text-[8px] font-mono font-bold uppercase tracking-widest border px-1 rounded-xs ${rarityStyle(item.rarity).ring} ${rarityStyle(item.rarity).color} ${rarityStyle(item.rarity).bg}`}
                    >
                      {rarityStyle(item.rarity).label}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-text-muted mt-0.5">
                  {item.slot === "head" && "Morrión / Cabeza"}
                  {item.slot === "body" && "Coraza / Cuerpo"}
                  {item.slot === "mainHand" && "Arma Principal"}
                  {item.slot === "offHand" && "Arma Secundaria"}
                  {item.slot === "firearm" && "Arcabuz / Distancia"}
                  {item.slot === "boots" && "Calzado"}
                  {item.slot === "accessory" && "Reliquia / Accesorio"}
                  {item.slot === "consumable" && "Consumible"}
                </p>
              </div>
            </div>

            {/* Requirements (rarity gating) */}
            {item.requirements && (
              <div className="text-[10px] font-mono text-amber-300 bg-amber-900/15 border border-amber-700/40 px-2 py-1 rounded-xs">
                {item.requirements.minRank && (
                  <span>Requiere rango: <strong className="capitalize">{item.requirements.minRank.replace(/_/g, " ")}</strong></span>
                )}
                {item.requirements.minHonor !== undefined && (
                  <span className="ml-2">· Honor ≥ <strong>{item.requirements.minHonor}</strong></span>
                )}
              </div>
            )}

            {/* Passives */}
            {item.passives && item.passives.length > 0 && (
              <div className={`${rarityStyle(item.rarity).bg} border ${rarityStyle(item.rarity).ring} p-2 rounded-xs space-y-1`}>
                <span className={`text-[9px] uppercase tracking-widest font-mono ${rarityStyle(item.rarity).color} block`}>
                  Pasivas ({item.passives.length})
                </span>
                {item.passives.map((p) => (
                  <div key={p.id} className="text-[10px] font-sans text-text leading-snug">
                    <span className={`font-bold ${rarityStyle(item.rarity).color}`}>{p.name}</span>
                    <span className="text-text-muted text-[9px] font-mono uppercase ml-1.5">[{TRIGGER_LABEL[p.trigger]}]</span>
                    <div className="text-text-muted text-[10px] italic mt-0.5">{passiveShortLine(p)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Effects / Stats Comparison */}
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

                  const statLabel = statInfo[key]?.name ?? key;
                  const sign = val >= 0 ? "+" : "";

                  return (
                    <div key={key} className="flex justify-between items-center py-0.5 border-b border-iron/10 last:border-0">
                      <span className="capitalize text-text-muted">{statLabel}</span>
                      <span className="font-bold flex items-center gap-1.5">
                        <span className={val > 0 ? "text-success" : val < 0 ? "text-danger" : "text-text"}>
                          {sign}{val}
                        </span>
                        {hasComparison && diff !== 0 && (
                          <span className={`text-[9px] font-bold ${diff > 0 ? "text-success" : "text-danger"}`}>
                            ({diff > 0 ? `+${diff}` : diff})
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Description / Story */}
            <p className="text-xs font-serif italic text-text-muted leading-relaxed border-t border-iron/20 pt-2 pb-1">
              "{item.description}"
            </p>

            {/* Price tag */}
            <div className="flex justify-between items-center text-[10px] font-mono border-t border-iron/40 pt-2 text-text-muted">
              <span>Valor Sugerido</span>
              <span className="text-gold font-bold flex items-center gap-0.5">
                <UiAssetIcon id="coins" label="" className="h-4 w-4" />
                {item.value} dob.
              </span>
            </div>
          </div>
        );
      }

      case "stat": {
        if (!statId) return null;
        const details = statInfo[statId];
        if (!details) return <div className="text-danger">Atributo desconocido ({statId})</div>;

        const baseVal = soldier.stats[statId] ?? 0;
        const bonuses = getEquipmentBonuses(soldier.equipment);
        const equipVal = bonuses[statId] ?? 0;
        const totalVal = baseVal + equipVal;

        return (
          <div className="w-64 p-4 space-y-2.5">
            {/* Header */}
            <div className="pb-1.5 border-b border-iron/40 flex justify-between items-center">
              <h4 className="font-cinzel font-bold text-gold uppercase text-sm tracking-wider">{details.name}</h4>
              <span className="font-mono font-bold text-sm text-gold-soft">{totalVal}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              {details.description}
            </p>

            {/* Math Breakdown */}
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

      case "wound": {
        if (!woundId) return null;
        const woundDef = getWound(woundId);
        if (!woundDef) return <div className="text-danger">Herida desconocida ({woundId})</div>;

        return (
          <div className="w-64 p-4 space-y-2.5">
            {/* Header */}
            <div className="pb-1.5 border-b border-iron/40 flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h4 className="font-cinzel font-bold text-gold-soft text-sm truncate leading-tight capitalize">
                  {woundDef.name}
                </h4>
                <p className="font-mono text-[9px] uppercase tracking-wider text-text-muted mt-0.5">
                  Gravedad: {woundDef.severity === 1 ? "I (Leve)" : woundDef.severity === 2 ? "II (Moderada)" : woundDef.severity === 3 ? "III (Grave)" : "IV (Infectada)"}
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

            {/* Description */}
            <p className="text-xs font-serif italic text-text-muted leading-relaxed">
              "{woundDef.description}"
            </p>

            {/* Penalty */}
            <div className="font-mono text-[10px] space-y-1 pt-1.5 border-t border-iron/20">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Penalización Actual:</span>
                <span className={`font-bold ${treated ? "text-success" : "text-danger"}`}>
                  {treated ? "Ninguna (Cicatriza)" : "-2 en Combate"}
                </span>
              </div>

              {/* Attributes directly affected */}
              {!treated && woundDef.effects && Object.keys(woundDef.effects).length > 0 && (
                <div className="bg-danger/5 border border-danger/10 p-1.5 rounded-xs mt-1.5">
                  <span className="text-[9px] text-danger/80 block uppercase mb-0.5">Drenaje de Atributo:</span>
                  {Object.entries(woundDef.effects).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-[10px] text-danger font-semibold">
                      <span className="capitalize">{statInfo[key as StatId]?.name ?? key}</span>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Treatment */}
            {!treated && woundDef.treatmentItems && (
              <div className="font-mono text-[10px] border-t border-iron/20 pt-2 space-y-1">
                <span className="text-text-muted block text-[9px] uppercase tracking-wider">Tratamiento Recomendado:</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {woundDef.treatmentItems.map((item: string) => (
                    <span key={item} className="bg-stone-900 border border-iron/60 px-1.5 py-0.5 text-gold-soft rounded-xs text-[9px] font-bold">
                      {item === "objeto_002" || item === "clean_bandage" ? "Venda de lino" : item === "wine_skin" ? "Odre de Vino" : item}
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

      default:
        return (
          <div className="w-52 p-3 font-serif italic text-left text-text leading-relaxed">
            "{content}"
          </div>
        );
    }
  };

  if (!children) {
    return (
      <div
        className="relative inline-flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          className="text-gold-soft/50 hover:text-gold transition-colors cursor-help p-0.5 focus:outline-hidden"
          aria-label="Información"
        >
          <Info className="h-4 w-4" />
        </button>
        {visible && (
          <div
            className={`absolute z-50 bg-stone-950/98 backdrop-blur-md border border-gold/45 text-text rounded-xs shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 ${positionClasses[position]}`}
          >
            {renderContent()}
            {/* Arrow */}
            {position === "top" && (
              <>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gold/45" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-950 -mt-[1px]" />
              </>
            )}
            {position === "bottom" && (
              <>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gold/45" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-stone-950 -mb-[1px]" />
              </>
            )}
            {position === "left" && (
              <>
                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gold/45" />
                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-950 -ml-[1px]" />
              </>
            )}
            {position === "right" && (
              <>
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gold/45" />
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-950 -mr-[1px]" />
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 bg-stone-950/98 backdrop-blur-md border border-gold/45 text-text rounded-xs shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 ${positionClasses[position]}`}
        >
          {renderContent()}
          {/* Arrow */}
          {position === "top" && (
            <>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gold/45" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-950 -mt-[1px]" />
            </>
          )}
          {position === "bottom" && (
            <>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gold/45" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-stone-950 -mb-[1px]" />
            </>
          )}
          {position === "left" && (
            <>
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gold/45" />
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-950 -ml-[1px]" />
            </>
          )}
          {position === "right" && (
            <>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gold/45" />
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-950 -mr-[1px]" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
