"use client";

import React from "react";
import type { CharacterState, StatId } from "@/lib/types";
import { useGameStore } from "@/lib/game-store";
import { getRankName } from "@/lib/game-data";
import { FitBadge } from "@/components/ui/fit-badge";
import { RoleIcon } from "@/components/ui/role-icon";
import { CharacterPortrait } from "@/components/ui/character-portrait";
import { FatigueBar, StatChip } from "@/components/ui/stat-chip";
import {
  COMBAT_STAT_LABEL,
  getFitState,
  pickTopStat,
} from "@/lib/formation";

export const TERCIO_DND_TYPE = "application/x-tercio-character";

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

  const topStat: StatId = pickTopStat(character.stats);
  const fit = getFitState(character, character.formationSlot);
  const isActive = character.id === activeCharacterId;

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
      <CharacterPortrait
        assetId={character.portraitAssetId}
        name={character.name}
        size="sm"
        withPlayerBadge={isPlayer}
        className="h-12 w-12"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <h3 className="truncate font-cinzel text-[12px] font-bold text-text leading-tight">
              {character.name}
            </h3>
            <p className="flex items-center gap-1 truncate font-mono text-[9px] uppercase tracking-wider text-text-muted">
              <RoleIcon role={character.role} className="h-3 w-3 shrink-0" />
              <span className="truncate">{character.role}</span>
              <span className="text-iron/70">·</span>
              <span className="truncate">{getRankName(character.rank)}</span>
            </p>
          </div>
          <FitBadge fit={fit} isPlayer={isPlayer} />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <StatChip
            statId={topStat}
            label={COMBAT_STAT_LABEL[topStat]}
            value={character.stats[topStat]}
            tone="gold"
            compact
          />
          <StatChip
            statId="discipline"
            label="Disc"
            value={character.stats.discipline}
            compact
          />
          <StatChip
            statId="vigor"
            label="Vig"
            value={character.stats.vigor}
            compact
          />
        </div>

        <FatigueBar value={character.fatigue} ariaLabel={`Fatiga de ${character.name}`} />

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
