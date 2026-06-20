"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { CharacterState, FormationSlot } from "@/lib/types";
import { StripeToken, type TokenSize } from "./stripe-token";
import { TERCIO_DND_TYPE } from "./stripe-card";
import {
  COMBAT_STAT_LABEL,
  FORMATION_META,
  getFitState,
  pickTopStat,
} from "@/lib/formation";
import { getAssetPathById } from "@/lib/game-data";
import { CharacterPortrait } from "@/components/ui/character-portrait";
import { FormationBackdrop } from "@/components/ui/formation-backdrop";
import { SlotPlaque } from "@/components/ui/slot-plaque";

const LINE_ORDER: FormationSlot[] = [
  "retaguardia",
  "apoyo",
  "fuego",
  "vanguardia",
  "banquillo",
];

const SLOT_LAYOUT: Record<
  FormationSlot,
  {
    label: string;
    top: string;
    left: string;
    width: string;
    minHeight: string;
    tokenSize: TokenSize;
    ring: string;
    justify: string;
  }
> = {
  retaguardia: {
    label: "left-[48%] top-[15%]",
    top: "17%",
    left: "40%",
    width: "28%",
    minHeight: "28%",
    tokenSize: "sm",
    ring: "border-sky-300/70 bg-sky-500/18",
    justify: "justify-center",
  },
  apoyo: {
    label: "left-[63%] top-[41%]",
    top: "35%",
    left: "50%",
    width: "30%",
    minHeight: "32%",
    tokenSize: "md",
    ring: "border-emerald-300/65 bg-emerald-500/14",
    justify: "justify-center",
  },
  fuego: {
    label: "left-[17%] top-[42%]",
    top: "37%",
    left: "17%",
    width: "30%",
    minHeight: "32%",
    tokenSize: "md",
    ring: "border-amber-300/70 bg-amber-500/16",
    justify: "justify-center",
  },
  vanguardia: {
    label: "left-[58%] top-[69%]",
    top: "56%",
    left: "28%",
    width: "42%",
    minHeight: "36%",
    tokenSize: "lg",
    ring: "border-blue-300/75 bg-blue-500/18",
    justify: "justify-center",
  },
  banquillo: {
    label: "left-[8%] top-[75%]",
    top: "72%",
    left: "8%",
    width: "25%",
    minHeight: "24%",
    tokenSize: "sm",
    ring: "border-stone-300/45 bg-stone-500/10",
    justify: "justify-start",
  },
};

interface BattlePosition {
  x: number;
  y: number;
}

const GRID_COLUMNS = 5;
const GRID_ROWS = 4;
const GRID_BOUNDS = {
  minX: 14,
  maxX: 86,
  minY: 28,
  maxY: 88,
} as const;

const DEFAULT_SLOT_POSITION: Record<FormationSlot, BattlePosition> = {
  retaguardia: { x: 50, y: 28 },
  fuego: { x: 32, y: 68 },
  apoyo: { x: 68, y: 68 },
  vanguardia: { x: 50, y: 88 },
  banquillo: { x: 14, y: 88 },
};

const DEFAULT_OFFSET: BattlePosition[] = [
  { x: -18, y: 0 },
  { x: 18, y: 0 },
  { x: 0, y: -20 },
  { x: -36, y: 0 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function gridStep(axis: "x" | "y") {
  if (axis === "x") return (GRID_BOUNDS.maxX - GRID_BOUNDS.minX) / (GRID_COLUMNS - 1);
  return (GRID_BOUNDS.maxY - GRID_BOUNDS.minY) / (GRID_ROWS - 1);
}

function snapAxis(value: number, axis: "x" | "y") {
  const min = axis === "x" ? GRID_BOUNDS.minX : GRID_BOUNDS.minY;
  const max = axis === "x" ? GRID_BOUNDS.maxX : GRID_BOUNDS.maxY;
  const step = gridStep(axis);
  const snapped = min + Math.round((clamp(value, min, max) - min) / step) * step;
  return Math.round(snapped * 100) / 100;
}

function snapToGrid(position: BattlePosition): BattlePosition {
  return {
    x: snapAxis(position.x, "x"),
    y: snapAxis(position.y, "y"),
  };
}

function getDefaultBattlePosition(character: CharacterState, index: number): BattlePosition {
  const base = DEFAULT_SLOT_POSITION[character.formationSlot];
  const offset = DEFAULT_OFFSET[index % DEFAULT_OFFSET.length];
  return snapToGrid({
    x: base.x + offset.x,
    y: base.y + offset.y,
  });
}

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
    () => LINE_ORDER.flatMap((slot) => grouped[slot]),
    [grouped],
  );
  const deployed = allCharacters.filter((character) => character.formationSlot !== "banquillo");
  const leader = deployed
    .slice()
    .sort((a, b) => b.stats.command - a.stats.command || b.stats.discipline - a.stats.discipline)[0];

  return (
    <div className="overflow-hidden rounded-xs border border-stone-700/55 bg-stone-950/65 shadow-inner">
      <div className="flex flex-col lg:min-h-[610px] lg:flex-row">
        <FormationStage
          grouped={grouped}
          allCharacters={allCharacters}
          playerId={playerId}
          draggedId={draggedId}
          deployedCount={deployed.length}
          leader={leader}
          onDrop={onDrop}
          onDragStateChange={onDragStateChange}
        />
        <RosterPanel characters={allCharacters} playerId={playerId} />
      </div>
    </div>
  );
}

function FormationStage({
  grouped,
  allCharacters,
  playerId,
  draggedId,
  deployedCount,
  leader,
  onDrop,
  onDragStateChange,
}: {
  grouped: Record<FormationSlot, CharacterState[]>;
  allCharacters: CharacterState[];
  playerId: string;
  draggedId: string | null;
  deployedCount: number;
  leader: CharacterState | undefined;
  onDrop: (characterId: string, targetSlot: FormationSlot) => void;
  onDragStateChange: (id: string | null) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const defaultPositions = useMemo(() => {
    const slotCounts: Partial<Record<FormationSlot, number>> = {};
    return Object.fromEntries(
      allCharacters.map((character) => {
        const index = slotCounts[character.formationSlot] ?? 0;
        slotCounts[character.formationSlot] = index + 1;
        return [character.id, getDefaultBattlePosition(character, index)];
      }),
    ) as Record<string, BattlePosition>;
  }, [allCharacters]);
  const [freePositions, setFreePositions] =
    useState<Record<string, BattlePosition>>(defaultPositions);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const setCharacterPosition = useCallback((id: string, position: BattlePosition) => {
    setFreePositions((current) => ({
      ...current,
      [id]: position,
    }));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      const characterId = String(event.active.id);
      const current = freePositions[characterId] ?? defaultPositions[characterId];
      if (!current) return;
      const rect = stage.getBoundingClientRect();
      setCharacterPosition(
        characterId,
        snapToGrid({
          x: current.x + (event.delta.x / rect.width) * 100,
          y: current.y + (event.delta.y / rect.height) * 100,
        }),
      );
    },
    [defaultPositions, freePositions, setCharacterPosition],
  );

  return (
    <div className="relative min-h-[660px] flex-1 overflow-hidden bg-[#213514] lg:min-h-[640px]">
      <FormationBackdrop />

      <div className="absolute left-3 right-3 top-3 z-30 flex flex-wrap items-center justify-between gap-2 rounded-xs border border-stone-800/45 bg-stone-950/72 px-3 py-2 shadow-lg backdrop-blur-[2px]">
        <div>
          <h2 className="font-cinzel text-[12px] font-bold uppercase tracking-[0.16em] text-amber-100">
            Formacion de batalla
          </h2>
          <p className="font-mono text-[10px] font-bold uppercase text-amber-300">
            Desplegados: {deployedCount}/5
            {leader ? ` - Cabo: ${leader.name.split(" ")[0]}` : ""}
          </p>
        </div>
        <span className="rounded-xs border border-amber-800/60 bg-amber-100/90 px-2 py-1 font-cinzel text-[10px] font-bold uppercase tracking-wide text-stone-950 shadow">
          Elige mando
        </span>
      </div>

      <div ref={stageRef} className="absolute inset-x-5 bottom-4 top-20 z-10 touch-none">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[48%] rounded-[50%] bg-lime-800/22 blur-sm"
          style={{ transform: "perspective(720px) rotateX(64deg)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-[16%] top-[16%] h-[56%] w-[66%] rounded-[50%] border border-lime-200/10 bg-lime-300/10"
          style={{ transform: "perspective(720px) rotateX(58deg)" }}
        />
        <BattleGrid />

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {LINE_ORDER.map((slot) => (
            <FormationDropSpot
              key={slot}
              slot={slot}
              characters={grouped[slot]}
              allCharacters={allCharacters}
              draggedId={draggedId}
              onDrop={onDrop}
              onDragStateChange={onDragStateChange}
            />
          ))}

          {allCharacters.map((character) => (
            <FreeBattlePiece
              key={character.id}
              character={character}
              isPlayer={character.id === playerId}
              position={freePositions[character.id] ?? defaultPositions[character.id]}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}

function FormationDropSpot({
  slot,
  characters,
  allCharacters,
  draggedId,
  onDrop,
  onDragStateChange,
}: {
  slot: FormationSlot;
  characters: CharacterState[];
  allCharacters: CharacterState[];
  draggedId: string | null;
  onDrop: (characterId: string, targetSlot: FormationSlot) => void;
  onDragStateChange: (id: string | null) => void;
}) {
  const layout = SLOT_LAYOUT[slot];
  const meta = FORMATION_META[slot];
  const [isOver, setIsOver] = useState(false);
  const occupant = characters[0];
  const draggedCharacter = allCharacters.find((character) => character.id === draggedId);
  const willSwap = Boolean(draggedCharacter && occupant && draggedCharacter.id !== occupant.id);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(TERCIO_DND_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) return;
    setIsOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(TERCIO_DND_TYPE)) return;
    event.preventDefault();
    const characterId = event.dataTransfer.getData(TERCIO_DND_TYPE);
    setIsOver(false);
    onDragStateChange(null);
    if (characterId) onDrop(characterId, slot);
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={meta.label}
      className={`absolute z-20 transition-transform duration-200 ${isOver ? "scale-[1.04]" : ""}`}
      style={{
        top: layout.top,
        left: layout.left,
        width: layout.width,
        minHeight: layout.minHeight,
      }}
    >
      <div className="absolute left-1/2 top-0 z-30 max-w-[170px] -translate-x-1/2">
        <SlotPlaque slot={slot} count={characters.length} willSwap={willSwap} size="sm" showIcon={false} />
      </div>
      <div
        className={`relative flex min-h-[inherit] items-end ${layout.justify} gap-1.5 px-2 pb-2 pt-9 md:gap-3`}
      >
        {characters.length === 0 ? (
          <EmptyRing slot={slot} highlighted={isOver} />
        ) : (
          <PositionRing slot={slot} highlighted={isOver} />
        )}
      </div>
      {isOver && willSwap && draggedCharacter && occupant && (
        <div className="absolute left-1/2 top-0 z-40 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-xs border border-amber-700/55 bg-amber-950/80 px-2 py-1 text-[10px] font-mono text-amber-200 shadow-lg">
          {draggedCharacter.name.split(" ")[0]} entra - {occupant.name.split(" ")[0]} sale
        </div>
      )}
    </section>
  );
}

function BattleGrid() {
  const columns = Array.from({ length: GRID_COLUMNS }, (_, index) => {
    const x = GRID_BOUNDS.minX + index * gridStep("x");
    return Math.round(x * 100) / 100;
  });
  const rows = Array.from({ length: GRID_ROWS }, (_, index) => {
    const y = GRID_BOUNDS.minY + index * gridStep("y");
    return Math.round(y * 100) / 100;
  });

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
      {columns.map((x) => (
        <span
          key={`col-${x}`}
          className="absolute bottom-[4%] top-[18%] w-px bg-amber-100/10"
          style={{ left: `${x}%` }}
        />
      ))}
      {rows.map((y) => (
        <span
          key={`row-${y}`}
          className="absolute left-[8%] right-[8%] h-px bg-amber-100/10"
          style={{ top: `${y}%` }}
        />
      ))}
      {rows.flatMap((y) =>
        columns.map((x) => (
          <span
            key={`cell-${x}-${y}`}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/25 bg-stone-950/25 shadow-[0_0_10px_rgba(245,205,120,0.16)]"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        )),
      )}
    </div>
  );
}

function FreeBattlePiece({
  character,
  isPlayer,
  position,
}: {
  character: CharacterState;
  isPlayer: boolean;
  position: BattlePosition;
}) {
  const layout = SLOT_LAYOUT[character.formationSlot];
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: character.id,
  });
  const dragX = transform?.x ?? 0;
  const dragY = transform?.y ?? 0;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute z-30 cursor-grab select-none touch-none transition-[filter] active:cursor-grabbing ${
        isDragging ? "z-50 scale-105 brightness-110" : ""
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate3d(${dragX}px, ${dragY}px, 0) translate(-50%, -100%)`,
      }}
      aria-label={`Mover ${character.name}`}
    >
      <div className="relative scale-[0.76] md:scale-100">
        <PositionRing slot={character.formationSlot} highlighted={isDragging} />
        <div className="relative z-10">
          <StripeToken
            character={character}
            isPlayer={isPlayer}
            size={layout.tokenSize}
            showLabel={false}
            nativeDrag={false}
            isDragging={isDragging}
          />
        </div>
      </div>
    </div>
  );
}

function PositionRing({
  slot,
  highlighted,
}: {
  slot: FormationSlot;
  highlighted: boolean;
}) {
  const layout = SLOT_LAYOUT[slot];
  return (
    <div
      aria-hidden="true"
      className={`absolute bottom-5 left-1/2 h-12 w-24 -translate-x-1/2 rounded-[50%] border-4 shadow-[0_0_18px_rgba(62,136,255,0.25)] ${layout.ring} ${
        highlighted ? "opacity-100 brightness-125" : "opacity-85"
      }`}
      style={{ transform: "translateX(-50%) perspective(240px) rotateX(64deg)" }}
    />
  );
}

function EmptyRing({
  slot,
  highlighted,
}: {
  slot: FormationSlot;
  highlighted: boolean;
}) {
  const meta = FORMATION_META[slot];
  const layout = SLOT_LAYOUT[slot];
  return (
    <div className="relative flex h-24 min-w-[120px] items-end justify-center">
      <div
        aria-hidden="true"
        className={`absolute bottom-2 h-14 w-28 rounded-[50%] border-4 border-dashed ${layout.ring} ${
          highlighted ? "brightness-125" : "opacity-75"
        }`}
        style={{ transform: "perspective(240px) rotateX(64deg)" }}
      />
      <span className="relative z-10 rounded-xs border border-stone-700/60 bg-stone-950/70 px-2 py-1 font-serif text-[10px] italic text-stone-300">
        {highlighted ? "Soltar" : meta.label}
      </span>
    </div>
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
    <aside className="relative border-t border-stone-700/55 bg-stone-900/82 p-2 lg:w-[212px] lg:border-l lg:border-t-0">
      <div className="mb-2 flex rounded-xs border border-amber-900/55 bg-stone-950/60 p-1">
        <span className="flex-1 rounded-xs bg-amber-100 px-2 py-1 text-center font-cinzel text-[10px] font-bold uppercase text-stone-950">
          Cabos
        </span>
        <span className="flex-1 px-2 py-1 text-center font-cinzel text-[10px] font-bold uppercase text-stone-300">
          Reserva
        </span>
      </div>
      <h3 className="mb-2 font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100">
        Elige tus hombres
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
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
  const portraitSrc = getAssetPathById(character.portraitAssetId);
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
        {fit === "encaja" && (
          <CheckMark />
        )}
      </div>
      <div className="px-1 py-1">
        <p className="truncate text-center font-cinzel text-[9px] font-bold text-amber-100">
          {character.name.split(" ")[0]}
        </p>
        <p className="text-center font-mono text-[8px] text-stone-400">
          {COMBAT_STAT_LABEL[topStat]} {character.stats[topStat]}
        </p>
      </div>
    </article>
  );
}

function CheckMark() {
  return (
    <span className="absolute -right-1 -top-1 flex h-8 w-8 rotate-12 items-center justify-center rounded-full border border-lime-200/60 bg-lime-500/90 text-stone-950 shadow">
      <Check className="h-5 w-5 stroke-[4]" aria-hidden="true" />
    </span>
  );
}
