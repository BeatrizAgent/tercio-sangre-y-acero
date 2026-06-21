// SlotPlaque: renders the role header used in formation-column.tsx,
// tercio-battle-line.tsx, and tercio-formation-view.tsx (slot icon, label,
// preferred stat badge). Unifies the three near-duplicate copies.

"use client";

import React from "react";
import Image from "next/image";
import { Tooltip } from "./tooltip";
import {
  COMBAT_STAT_LABEL,
  FORMATION_META,
  type FormationMeta,
} from "@/lib/domain/formation";
import type { FormationSlot } from "@/lib/types";
import { formationRoleIconPaths } from "@/lib/game-data";

export function SlotPlaque({
  slot,
  count,
  willSwap = false,
  size = "md",
  showIcon = true,
  showPreferredStat = true,
  className = "",
}: {
  slot: FormationSlot;
  count: number;
  willSwap?: boolean;
  size?: "sm" | "md";
  showIcon?: boolean;
  showPreferredStat?: boolean;
  className?: string;
}) {
  const meta: FormationMeta = FORMATION_META[slot];
  const { Icon, preferredStat } = meta;
  const isSm = size === "sm";

  return (
    <div
      className={`flex items-center gap-1.5 transition-colors ${
        isSm
          ? "rounded-xs border border-stone-700/55 bg-stone-950/76 px-2 py-1 shadow-lg backdrop-blur-[2px] hover:border-amber-400/45"
          : "rounded-xs border border-stone-700/65 bg-stone-900/60 px-2 pt-1.5 pb-1 hover:border-amber-400/45"
      } ${className}`}
    >
      {showIcon && (
        <Image
          src={formationRoleIconPaths[slot]}
          alt=""
          width={32}
          height={32}
          aria-hidden="true"
          className={`${isSm ? "h-5 w-5" : "h-5 w-5"} object-contain`}
        />
      )}
      <Icon className={`${isSm ? "h-3 w-3" : "h-3 w-3"} text-amber-200/65`} aria-hidden="true" />
      <span
        className={`truncate font-cinzel ${
          isSm ? "text-[10px]" : "text-[13px]"
        } font-bold uppercase tracking-wider text-amber-100`}
      >
        {meta.label}
      </span>
      {count > 0 && (
        <span className={`font-mono ${isSm ? "text-[8px]" : "text-[10px]"} text-stone-500`}>
          {count}
          {willSwap ? " swap" : ""}
        </span>
      )}
      {showPreferredStat && preferredStat && (
        <Tooltip type="stat" statId={preferredStat}>
          <span
            className={`rounded-xs border border-stone-700/55 bg-stone-950/55 px-1 font-mono ${
              isSm ? "text-[7px]" : "text-[8px]"
            } font-bold uppercase tracking-widest text-stone-300`}
          >
            {COMBAT_STAT_LABEL[preferredStat]}
          </span>
        </Tooltip>
      )}
    </div>
  );
}
