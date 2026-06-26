"use client";

import React, { useMemo, useState } from "react";
import type { CharacterState, FormationSlot } from "@/lib/types";
import { StripeToken } from "./stripe-token";
import { TERCIO_DND_TYPE } from "./stripe-card";
import {
  COMBAT_STAT_LABEL,
  FORMATION_META,
  FORMATION_ORDER,
  getFitState,
  pickTopStat,
} from "@/lib/domain/formation";
import { getAssetPathById } from "@/lib/game-data";
import { getPlayerPortraitPathById } from "@/lib/data/player-portraits";
import { SlotPlaque } from "@/components/ui/slot-plaque";
import { FitBadge } from "@/components/ui/fit-badge";
import Image from "next/image";

const BOARD_ROWS: FormationSlot[][] = [
  ["retaguardia"],
  ["fuego", "apoyo"],
  ["vanguardia"],
  ["banquillo"],
];

interface TercioBattleLineProps {
  grouped: Record<FormationSlot, CharacterState[]>;
  playerId: string;
  draggedId: string | null;
  onDrop: (characterId: string, targetSlot: FormationSlot) => void;
  onDragStateChange: (id: string | null) => void;
}

export function TercioBattleLine({
  grouped,
  playerId,
  draggedId,
  onDrop,
  onDragStateChange,
}: TercioBattleLineProps) {
  const allCharacters = useMemo(
    () => FORMATION_ORDER.flatMap((slot) => grouped[slot]),
    [grouped],
  );
  const deployed = allCharacters.filter((character) => character.formationSlot !== "banquillo");
  const leader = deployed
    .slice()
    .sort((a, b) => b.stats.command - a.stats.command || b.stats.discipline - a.stats.discipline)[0];

  return (
    <div className="overflow-hidden rounded-xs border border-stone-700/55 bg-stone-950/70 shadow-inner">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_250px]">
        <section className="relative overflow-hidden bg-[#25361e] p-3">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-55"
            style={{
              backgroundImage:
                "linear-gradient(rgba(232,213,170,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(232,213,170,0.08) 1px, transparent 1px)",
              backgroundSize: "96px 96px",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_center,rgba(150,110,54,0.26),transparent_68%)]"
          />

          <div className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xs border border-stone-800/55 bg-stone-950/78 px-3 py-2 shadow-lg">
            <div>
              <h2 className="font-cinzel text-[12px] font-bold uppercase tracking-[0.16em] text-amber-100">
                Formacion de batalla
              </h2>
              <p className="font-mono text-[10px] font-bold uppercase text-amber-300">
                Desplegados: {deployed.length}/5
                {leader ? ` - Cabo: ${leader.name.split(" ")[0]}` : ""}
              </p>
            </div>
            <span className="rounded-xs border border-amber-800/60 bg-amber-100/90 px-2 py-1 font-cinzel text-[10px] font-bold uppercase tracking-wide text-stone-950 shadow">
              Ordenanza fija
            </span>
          </div>

          <div className="relative z-10 flex min-h-[720px] flex-col justify-between gap-3">
            {BOARD_ROWS.map((row) => (
              <div
                key={row.join("-")}
                className={`grid gap-3 ${row.length === 2 ? "md:grid-cols-2" : "grid-cols-1"}`}
              >
                {row.map((slot) => (
                  <RpgSlot
                    key={slot}
                    slot={slot}
                    characters={grouped[slot]}
                    playerId={playerId}
                    draggedId={draggedId}
                    onDrop={onDrop}
                    onDragStateChange={onDragStateChange}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        <RosterPanel characters={allCharacters} playerId={playerId} />
      </div>
    </div>
  );
}

function RpgSlot({
  slot,
  characters,
  playerId,
  draggedId,
  onDrop,
  onDragStateChange,
}: {
  slot: FormationSlot;
  characters: CharacterState[];
  playerId: string;
  draggedId: string | null;
  onDrop: (characterId: string, targetSlot: FormationSlot) => void;
  onDragStateChange: (id: string | null) => void;
}) {
  const meta = FORMATION_META[slot];
  const [isOver, setIsOver] = useState(false);
  const hasCharacters = characters.length > 0;

  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes(TERCIO_DND_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!isOver) setIsOver(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLElement>) {
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) return;
    setIsOver(false);
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes(TERCIO_DND_TYPE)) return;
    event.preventDefault();
    const characterId = event.dataTransfer.getData(TERCIO_DND_TYPE);
    setIsOver(false);
    onDragStateChange(null);
    if (characterId) onDrop(characterId, slot);
  }

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={meta.label}
      className={`relative min-h-[168px] rounded-xs border p-2 transition-colors ${
        isOver
          ? "border-amber-200/75 bg-amber-100/12"
          : "border-stone-700/65 bg-stone-950/46"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <SlotPlaque slot={slot} count={characters.length} size="sm" />
        {isOver && (
          <span className="rounded-xs border border-amber-800/60 bg-amber-950/75 px-2 py-1 font-mono text-[9px] uppercase text-amber-200">
            Soltar
          </span>
        )}
      </div>

      <div className="flex min-h-[138px] items-end justify-center gap-4 overflow-hidden rounded-xs border border-stone-800/50 bg-stone-900/25 px-3 pt-2">
        {hasCharacters ? (
          characters.map((character, index) => (
            <StripeToken
              key={character.id}
              character={character}
              isPlayer={character.id === playerId}
              size="md"
              poseIndex={index}
              showLabel={false}
              isDragging={character.id === draggedId}
              onDragStart={onDragStateChange}
              onDragEnd={() => onDragStateChange(null)}
            />
          ))
        ) : (
          <p className="self-center text-center font-serif text-[11px] italic text-stone-500">
            Puesto vacante
          </p>
        )}
      </div>
    </section>
  );
}

function RosterPanel({
  characters,
  playerId,
}: {
  characters: CharacterState[];
  playerId: string;
}) {
  return (
    <aside className="relative border-t border-stone-700/55 bg-stone-900/82 p-2 lg:border-l lg:border-t-0">
      <div className="mb-2 flex rounded-xs border border-amber-900/55 bg-stone-950/60 p-1">
        <span className="flex-1 rounded-xs bg-amber-100 px-2 py-1 text-center font-cinzel text-[10px] font-bold uppercase text-stone-950">
          Cabos
        </span>
        <span className="flex-1 px-2 py-1 text-center font-cinzel text-[10px] font-bold uppercase text-stone-300">
          Orden
        </span>
      </div>
      <h3 className="mb-2 font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100">
        Hombres
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {characters.map((character) => (
          <RosterCard
            key={character.id}
            character={character}
            isPlayer={character.id === playerId}
          />
        ))}
      </div>
    </aside>
  );
}

function RosterCard({
  character,
  isPlayer,
}: {
  character: CharacterState;
  isPlayer: boolean;
}) {
  const portraitSrc = getPlayerPortraitPathById(character.portraitAssetId) ?? getAssetPathById(character.portraitAssetId);
  const topStat = pickTopStat(character.stats);
  const fit = getFitState(character, character.formationSlot);

  return (
    <article
      className={`relative overflow-hidden rounded-xs border bg-stone-950/70 shadow-md ${
        isPlayer ? "border-amber-300/70" : "border-stone-700/70"
      }`}
    >
      <div className="relative aspect-square bg-stone-900">
        {portraitSrc ? (
          <Image
            src={portraitSrc}
            alt={character.name}
            width={220}
            height={220}
            className="h-full w-full object-cover object-top"
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] text-stone-500">
            {character.name.slice(0, 2)}
          </div>
        )}
        <span className="absolute bottom-0 left-0 right-0 bg-stone-950/78 px-1 py-0.5 text-center font-mono text-[8px] font-bold uppercase text-amber-100">
          {isPlayer ? "tu" : character.role}
        </span>
        <FitBadge fit={fit} isPlayer={isPlayer} className="absolute -right-1 -top-1" />
      </div>
      <div className="space-y-0.5 px-1 py-1">
        <p className="truncate text-center font-cinzel text-[9px] font-bold text-amber-100">
          {character.name.split(" ")[0]}
        </p>
        <p className="text-center font-mono text-[8px] leading-tight text-stone-400">
          {COMBAT_STAT_LABEL[topStat]} {character.stats[topStat]}
        </p>
        <p className="text-center font-mono text-[8px] leading-tight text-stone-500">
          Fatiga {character.fatigue}/100
        </p>
      </div>
    </article>
  );
}
