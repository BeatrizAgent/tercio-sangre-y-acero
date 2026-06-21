"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { AlertTriangle, Check } from "lucide-react";
import type { CharacterState } from "@/lib/types";
import { formationRoleIconPaths, getAssetPathById } from "@/lib/game-data";
import { TERCIO_DND_TYPE } from "./stripe-card";
import {
  COMBAT_STAT_LABEL,
  getFitState,
  isNCOInStress,
  pickTopStat,
} from "@/lib/domain/formation";
import { fatigueLabel } from "@/components/ui/stat-chip";
import { Tooltip } from "@/components/ui/tooltip";

export type TokenSize = "sm" | "md" | "lg";

interface TokenDim {
  height: number;
  width: number;
}

const SIZE: Record<TokenSize, TokenDim> = {
  sm: { height: 150, width: 72 },
  md: { height: 210, width: 104 },
  lg: { height: 270, width: 132 },
};

const SLOT_POSE: Record<string, string> = {
  retaguardia: "-rotate-[4deg] translate-y-2",
  apoyo: "rotate-[3deg] translate-y-0",
  fuego: "-rotate-[2deg] -translate-y-1",
  vanguardia: "rotate-[1deg] -translate-y-3",
  banquillo: "rotate-[4deg] translate-y-2 saturate-[0.82]",
};

const ROLE_POSE: Record<string, string> = {
  Piquero: "scale-[1.04]",
  Tirador: "-skew-x-[2deg] scale-[0.98]",
  Asistente: "skew-x-[1deg] scale-[0.95]",
  Jinete: "rotate-[2deg] scale-[1.02]",
  Gastador: "-rotate-[2deg] scale-[1.05]",
};

const STAGGER: string[] = [
  "translate-x-0",
  "md:-translate-x-3",
  "md:translate-x-3",
  "md:-translate-x-5",
];

const COMPANY_SPRITE_PATH: Record<string, string> = {
  diego_de_arce: "/assets/generated/company-sprites/pikeman_player.png",
  lope_de_saavedra: "/assets/generated/company-sprites/arquebusier_player.png",
  martin_de_cuenca: "/assets/generated/company-sprites/surgeon.png",
  alonso_de_valdes: "/assets/generated/company-sprites/captain_player.png",
  sancho_de_leiva: "/assets/generated/company-sprites/halberdier_player.png",
};

interface StripeTokenProps {
  character: CharacterState;
  isPlayer: boolean;
  size?: TokenSize;
  poseIndex?: number;
  showLabel?: boolean;
  nativeDrag?: boolean;
  isDragging?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

export function StripeToken({
  character,
  isPlayer,
  size = "md",
  poseIndex = 0,
  showLabel = true,
  nativeDrag = true,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: StripeTokenProps) {
  const { height, width } = SIZE[size];
  const inStress = isNCOInStress(character);
  const defaultSrc = useMemo(
    () => getAssetPathById(character.tercioAssetId),
    [character.tercioAssetId],
  );
  const emotionSrc = useMemo(
    () => getAssetPathById(character.emotionAssetId),
    [character.emotionAssetId],
  );
  const companySpriteSrc = COMPANY_SPRITE_PATH[character.id];
  const spriteSrc = companySpriteSrc ?? (inStress ? emotionSrc ?? defaultSrc : defaultSrc);
  const topStat = pickTopStat(character.stats);
  const fit = getFitState(character, character.formationSlot);
  const poseClass = `${SLOT_POSE[character.formationSlot] ?? ""} ${
    ROLE_POSE[character.role] ?? ""
  } ${STAGGER[poseIndex % STAGGER.length]}`;
  const fatigueLabelText = fatigueLabel(character.fatigue);

  return (
    <div
      draggable={nativeDrag}
      onDragStart={(event) => {
        if (!nativeDrag) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData(TERCIO_DND_TYPE, character.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(character.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`group relative flex cursor-grab flex-col items-center gap-1 transition-all duration-200 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      } ${poseClass}`}
      aria-grabbed={isDragging}
    >
      <div
        className={`relative shrink-0 ${
          isPlayer
            ? "drop-shadow-[0_13px_14px_rgba(0,0,0,0.88)]"
            : "drop-shadow-[0_9px_11px_rgba(0,0,0,0.76)]"
        }`}
        style={{ width, height }}
      >
        {spriteSrc ? (
          <Image
            src={spriteSrc}
            alt={character.name}
            width={600}
            height={1500}
            className={`pointer-events-none absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 object-contain object-bottom contrast-[1.08] saturate-[1.05] transition-[filter] duration-300 ${
              inStress ? "saturate-[0.7] brightness-[0.92]" : ""
            }`}
            draggable={false}
            loading="eager"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xs border-2 border-dashed border-stone-700/60 bg-stone-950/40 font-mono text-[10px] text-stone-500">
            sin sprite
          </div>
        )}

        <div className="pointer-events-none absolute bottom-5 left-1 flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/55 bg-stone-950/82 p-0.5 shadow-[0_4px_10px_rgba(0,0,0,0.55)]">
          <Image
            src={formationRoleIconPaths[character.formationSlot]}
            alt=""
            width={32}
            height={32}
            aria-hidden="true"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        <div className="pointer-events-none absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-xs border-b border-l border-stone-700/55 bg-stone-950/82">
          {fit === "encaja" && (
            <Check className="h-2.5 w-2.5" style={{ color: "#5fbf6f" }} />
          )}
          {fit === "fuera_de_rol" && (
            <AlertTriangle className="h-2.5 w-2.5" style={{ color: "#d4a04a" }} />
          )}
        </div>

        {isPlayer && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
            <span className="rounded-xs border border-amber-100/80 bg-amber-300 px-1.5 py-0.5 font-mono text-[8px] font-extrabold uppercase tracking-widest text-stone-950 shadow-md">
              tu
            </span>
          </div>
        )}

        {inStress && !isPlayer && (
          <div className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 -translate-y-full">
            <span className="rounded-xs border border-amber-700/55 bg-amber-950/70 px-1 py-0.5 font-mono text-[7px] font-bold uppercase tracking-widest text-amber-200 shadow-sm">
              {character.formationSlot === "banquillo"
                ? "reserva"
                : character.fatigue > 75
                  ? "agotado"
                  : "fuera de rol"}
            </span>
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2 rounded-full bg-black/60 blur-[3px]"
        />
      </div>

      {showLabel && (
        <div className="flex max-w-[104px] flex-col items-center gap-0.5 text-center leading-tight">
          <p className="w-full truncate rounded-xs border border-stone-700/45 bg-stone-950/70 px-1 font-cinzel text-[9px] font-bold text-amber-100 shadow-sm backdrop-blur-[1px]">
            {character.name}
          </p>
          <Tooltip
            content={`${character.role}. ${COMBAT_STAT_LABEL[topStat]} ${character.stats[topStat]}. Fatiga ${character.fatigue}/100 (${fatigueLabelText}).`}
          >
            <span className="rounded-xs border border-amber-900/45 bg-amber-950/35 px-1 font-mono text-[8px] text-amber-200">
              {COMBAT_STAT_LABEL[topStat]} {character.stats[topStat]}
            </span>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
