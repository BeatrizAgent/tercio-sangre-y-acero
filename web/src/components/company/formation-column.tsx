"use client";

import React, { useState } from "react";
import type { CharacterState, FormationSlot } from "@/lib/types";
import { StripeCard, TERCIO_DND_TYPE } from "./stripe-card";
import {
  COMBAT_STAT_LABEL,
  FORMATION_META,
  FORMATION_ORDER,
  getFitState,
} from "@/lib/domain/formation";
import { Tooltip } from "@/components/ui/tooltip";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

interface FormationColumnProps {
  slot: FormationSlot;
  characters: CharacterState[];
  playerId: string;
  draggedId: string | null;
  onDrop: (characterId: string, targetSlot: FormationSlot) => void;
  onDragStateChange?: (draggingId: string | null) => void;
}

export function FormationColumn({
  slot,
  characters,
  playerId,
  draggedId,
  onDrop,
  onDragStateChange,
}: FormationColumnProps) {
  const meta = FORMATION_META[slot];
  const count = characters.length;
  const empty = count === 0;
  const [isOver, setIsOver] = useState(false);

  const occupantId = characters[0]?.id;
  const willSwap = draggedId !== null && occupantId !== undefined && draggedId !== occupantId;
  const numeral = ROMAN[FORMATION_ORDER.indexOf(slot)] ?? "·";

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (!event.dataTransfer.types.includes(TERCIO_DND_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) return;
    setIsOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    if (!event.dataTransfer.types.includes(TERCIO_DND_TYPE)) return;
    event.preventDefault();
    const characterId = event.dataTransfer.getData(TERCIO_DND_TYPE);
    setIsOver(false);
    onDragStateChange?.(null);
    if (characterId) onDrop(characterId, slot);
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex min-h-[260px] flex-col gap-1.5 rounded-xs border p-2 shadow-md transition-all ${
        isOver
          ? "border-amber-200/70 bg-amber-100/8 shadow-[0_0_0_1px_rgba(232,213,170,0.45),0_8px_24px_rgba(0,0,0,0.55)]"
          : "border-stone-700/70 bg-stone-900/45"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 0% 0%, rgba(232, 213, 170, 0.06) 0%, transparent 55%)",
      }}
      aria-label={meta.label}
    >
      <ColumnHeader
        meta={meta}
        numeral={numeral}
        count={count}
        empty={empty}
        willSwap={willSwap}
        isOver={isOver}
      />

      <div className="flex flex-1 flex-col gap-1.5">
        {empty ? (
          <EmptyDropZone slot={slot} highlighted={isOver} />
        ) : (
          characters.map((character) => (
            <StripeCard
              key={character.id}
              character={character}
              isPlayer={character.id === playerId}
              isDragging={character.id === draggedId}
              onDragStart={() => onDragStateChange?.(character.id)}
              onDragEnd={() => onDragStateChange?.(null)}
            />
          ))
        )}
        {isOver && !empty && willSwap && occupantId && (
          <SwapHint
            draggedId={draggedId!}
            occupantId={occupantId}
            characters={characters}
            targetSlot={slot}
          />
        )}
      </div>
    </section>
  );
}

function ColumnHeader({
  meta,
  numeral,
  count,
  empty,
  willSwap,
  isOver,
}: {
  meta: (typeof FORMATION_META)[FormationSlot];
  numeral: string;
  count: number;
  empty: boolean;
  willSwap: boolean;
  isOver: boolean;
}) {
  const { Icon: SlotIcon, preferredStat } = meta;
  return (
    <header
      className={`flex flex-col gap-1 rounded-xs border px-2 pt-1.5 pb-1 transition-colors ${
        isOver
          ? "border-amber-200/65 bg-amber-100/12"
          : "border-stone-700/65 bg-stone-900/60"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border ${
              isOver
                ? "border-amber-200/65 bg-amber-950/50 text-amber-100"
                : "border-stone-700/70 bg-stone-950/65 text-amber-200/85"
            }`}
          >
            <SlotIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-baseline gap-1 truncate font-cinzel text-[13px] font-bold uppercase tracking-[0.06em] text-amber-100">
              <span className="font-mono text-[10px] text-amber-300/80">{numeral}.</span>
              <span className="truncate">{meta.label}</span>
            </h2>
            <p className="truncate font-serif text-[10px] italic text-stone-400">
              {meta.role}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
            empty
              ? "border-stone-700/70 bg-stone-950/55 text-stone-400"
              : "border-amber-900/55 bg-amber-950/30 text-amber-200"
          }`}
        >
          {count} {count === 1 ? "hombre" : "hombres"}
          {willSwap ? " · swap" : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <p className="truncate font-serif text-[10px] italic text-stone-500">{meta.flavor}</p>
        {preferredStat && (
          <Tooltip type="stat" statId={preferredStat}>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-xs border border-stone-700/60 bg-stone-950/60 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-stone-300">
              <span className="text-[7px] text-stone-500">pide</span>
              <span>{COMBAT_STAT_LABEL[preferredStat]}</span>
            </span>
          </Tooltip>
        )}
      </div>
      <div
        aria-hidden="true"
        className="h-px w-full bg-stone-600/45"
      />
    </header>
  );
}

function EmptyDropZone({
  slot,
  highlighted,
}: {
  slot: FormationSlot;
  highlighted: boolean;
}) {
  return (
    <div
      className={`flex flex-1 items-center justify-center rounded-xs border border-dashed px-2 py-4 transition-colors ${
        highlighted
          ? "border-amber-200/65 bg-amber-100/10"
          : "border-stone-700/55 bg-stone-950/30"
      }`}
    >
      <p className="text-center font-serif text-[10px] italic text-stone-400">
        {highlighted
          ? "Soltar aqui para cubrir la fila."
          : `Puesto vacante. Arrastra un cabo hasta ${FORMATION_META[slot].label.toLowerCase()}.`}
      </p>
    </div>
  );
}

function SwapHint({
  draggedId,
  occupantId,
  characters,
  targetSlot,
}: {
  draggedId: string;
  occupantId: string;
  characters: CharacterState[];
  targetSlot: FormationSlot;
}) {
  const dragged = characters.find((character) => character.id === draggedId);
  const occupant = characters.find((character) => character.id === occupantId);
  if (!dragged || !occupant) return null;
  const draggedFit = getFitState(dragged, targetSlot);
  const occupantFit = getFitState(occupant, targetSlot);
  return (
    <div className="rounded-xs border border-amber-700/55 bg-amber-950/25 px-2 py-1.5 text-[10px] font-mono text-amber-200">
      Swap: {dragged.name.split(" ")[0]} ({draggedFit}) toma la fila de {occupant.name.split(" ")[0]} ({occupantFit}).
    </div>
  );
}

// (Numeral mapping reads FORMATION_ORDER from lib/formation.ts)
