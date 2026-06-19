"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import {
  Check,
  AlertTriangle,
  Axe,
  Crosshair,
  HeartHandshake,
  Swords,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CharacterState, StatId } from "@/lib/types";
import { useGameStore } from "@/lib/game-store";
import { getAssetPathById, getRankName } from "@/lib/game-data";
import { Tooltip } from "@/components/ui/tooltip";
import {
  COMBAT_STAT_LABEL,
  getFitState,
  pickTopStat,
} from "@/lib/formation";

export const TERCIO_DND_TYPE = "application/x-tercio-character";

const ROLE_ICON: Record<string, LucideIcon> = {
  Piquero: Swords,
  Tirador: Crosshair,
  Asistente: HeartHandshake,
  Jinete: Swords,
  Gastador: Axe,
};

interface StripeCardProps {
  character: CharacterState;
  isPlayer: boolean;
  isDragging?: boolean;
  onDragStart?: (characterId: string) => void;
  onDragEnd?: () => void;
}

export function StripeCard({
  character,
  isPlayer,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: StripeCardProps) {
  const { activeCharacterId, setActiveCharacter } = useGameStore();

  const portraitSrc = useMemo(
    () => getAssetPathById(character.portraitAssetId),
    [character.portraitAssetId],
  );

  const topStat: StatId = pickTopStat(character.stats);
  const fit = getFitState(character, character.formationSlot);
  const RoleIcon = ROLE_ICON[character.role] ?? Swords;
  const isActive = character.id === activeCharacterId;

  const fatigueTone =
    character.fatigue > 75
      ? "bg-danger"
      : character.fatigue > 40
        ? "bg-ember"
        : "bg-success";
  const fatigueLabel = character.fatigue > 75 ? "agotado" : character.fatigue > 40 ? "cansado" : "fresco";
  const fatigueWidth = `${Math.max(0, Math.min(100, character.fatigue))}%`;

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(TERCIO_DND_TYPE, character.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(character.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`group relative flex cursor-grab gap-2 rounded-xs border p-2 transition-all active:cursor-grabbing ${
        isPlayer
          ? "border-gold/55 bg-gold/8 shadow-[0_0_0_1px_rgba(201,162,79,0.18)]"
          : "border-iron/70 bg-stone-950/55 hover:border-gold/35"
      } ${isDragging ? "opacity-40" : ""} ${
        fit === "fuera_de_rol" ? "ring-1 ring-inset ring-warning/30" : ""
      }`}
      aria-grabbed={isDragging}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xs border border-iron bg-stone-900 shadow-inner">
        {portraitSrc ? (
          <Image
            src={portraitSrc}
            alt={character.name}
            width={1086}
            height={1448}
            className="absolute inset-0 h-full w-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-mono text-text-muted">
            {character.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
          </div>
        )}
        {isPlayer && (
          <div className="absolute bottom-0 left-0 right-0 bg-gold/85 text-stone-950 text-[8px] font-mono font-extrabold uppercase tracking-widest text-center leading-tight py-0.5">
            tu
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <h3 className="truncate font-cinzel text-[12px] font-bold text-text leading-tight">
              {character.name}
            </h3>
            <p className="flex items-center gap-1 truncate font-mono text-[9px] uppercase tracking-wider text-text-muted">
              <RoleIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{character.role}</span>
              <span className="text-iron/70">·</span>
              <span className="truncate">{getRankName(character.rank)}</span>
            </p>
          </div>
          <FitBadge fit={fit} isPlayer={isPlayer} />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Tooltip type="stat" statId={topStat}>
            <span className="inline-flex items-center gap-1 rounded-xs border border-gold/45 bg-gold/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gold-soft">
              <span className="text-text-muted text-[8px] uppercase">
                {COMBAT_STAT_LABEL[topStat]}
              </span>
              <span>{character.stats[topStat]}</span>
            </span>
          </Tooltip>
          <Tooltip type="stat" statId="discipline">
            <span className="inline-flex items-center gap-1 rounded-xs border border-iron/70 bg-stone-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-text-muted">
              <span className="text-[8px] uppercase">Disc</span>
              <span className="text-text">{character.stats.discipline}</span>
            </span>
          </Tooltip>
          <Tooltip type="stat" statId="vigor">
            <span className="inline-flex items-center gap-1 rounded-xs border border-iron/70 bg-stone-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-text-muted">
              <span className="text-[8px] uppercase">Vig</span>
              <span className="text-text">{character.stats.vigor}</span>
            </span>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60 ring-1 ring-inset ring-iron/40"
            role="progressbar"
            aria-valuenow={character.fatigue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Fatiga de ${character.name}`}
          >
            <div
              className={`h-full ${fatigueTone} transition-all duration-300`}
              style={{ width: fatigueWidth }}
            />
          </div>
          <span className="font-mono text-[9px] text-text-muted shrink-0">
            {character.fatigue} · {fatigueLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isPlayer) setActiveCharacter(character.id);
          }}
          disabled={isPlayer}
          className={`mt-0.5 self-start rounded-xs border px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest transition-all ${
            isPlayer
              ? "border-gold/45 bg-gold/15 text-gold cursor-default"
              : isActive
                ? "border-gold/55 bg-gold/10 text-gold"
                : "border-iron bg-stone-950/50 text-text-muted hover:border-gold/35 hover:text-gold"
          }`}
          title={isPlayer ? "Soldado activo" : "Inspeccionar"}
        >
          {isPlayer ? "activo" : "ver"}
        </button>
      </div>
    </article>
  );
}

function FitBadge({ fit, isPlayer }: { fit: ReturnType<typeof getFitState>; isPlayer: boolean }) {
  if (fit === "encaja") {
    return (
      <Tooltip content="Su mejor stat coincide con la fila.">
        <span
          className={`shrink-0 inline-flex items-center gap-0.5 rounded-xs border px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${
            isPlayer
              ? "border-gold/55 bg-gold/15 text-gold"
              : "border-success/40 bg-success/12 text-success"
          }`}
          aria-label="Encaja en la fila"
        >
          <Check className="h-2.5 w-2.5" />
          <span>encaja</span>
        </span>
      </Tooltip>
    );
  }
  if (fit === "fuera_de_rol") {
    return (
      <Tooltip content="Su mejor stat no es el de esta fila. Cumple, pero arrastra lastre.">
        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-xs border border-warning/40 bg-warning/10 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-warning">
          <AlertTriangle className="h-2.5 w-2.5" />
          <span>fuera</span>
        </span>
      </Tooltip>
    );
  }
  return (
    <Tooltip content="En reserva. Sin puesto fijo.">
      <span className="shrink-0 inline-flex items-center gap-0.5 rounded-xs border border-iron/70 bg-stone-950/60 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-text-muted">
        <span>reserva</span>
      </span>
    </Tooltip>
  );
}
