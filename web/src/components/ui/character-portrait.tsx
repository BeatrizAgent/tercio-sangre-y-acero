// CharacterPortrait: single source of truth for rendering a CharacterState
// portrait via getAssetPathById. Provides consistent fallback (initials),
// size variants, and an optional RoleIcon overlay.
//
// Previously the same pattern was inlined in stripe-card.tsx, stripe-token.tsx,
// profile-role-tabs.tsx, the RosterCard inside tercio-battle-line.tsx, and
// the FormationToken inside tercio-formation-view.tsx.

"use client";

import React from "react";
import Image from "next/image";
import { getAssetPathById } from "@/lib/game-data";
import { RoleIcon } from "./role-icon";

export type PortraitSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<PortraitSize, number> = {
  xs: 32,
  sm: 48,
  md: 96,
  lg: 128,
  xl: 220,
};

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CharacterPortrait({
  assetId,
  name,
  role,
  size = "md",
  className = "",
  rounded = "xs",
  withRoleIcon = false,
  withPlayerBadge = false,
  roundedFull = false,
  onErrorHide = true,
}: {
  assetId: string | undefined;
  name: string;
  role?: string;
  size?: PortraitSize;
  className?: string;
  rounded?: "xs" | "sm" | "md" | "full";
  withRoleIcon?: boolean;
  withPlayerBadge?: boolean;
  roundedFull?: boolean;
  onErrorHide?: boolean;
}) {
  const px = SIZE_PX[size];
  const src = getAssetPathById(assetId);
  const radiusClass = roundedFull
    ? "rounded-full"
    : rounded === "full"
      ? "rounded-full"
      : `rounded-${rounded}`;
  const roleBadgeSize = size === "xs" || size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const playerBadgeSize =
    size === "xs" || size === "sm" ? "text-[7px] py-0" : "text-[8px] py-0.5";

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-iron bg-stone-900 shadow-inner ${radiusClass} ${className}`}
      style={{ width: px, height: px }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="absolute inset-0 h-full w-full object-cover object-top"
          draggable={false}
          onError={
            onErrorHide
              ? (event) => {
                  event.currentTarget.style.display = "none";
                }
              : undefined
          }
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-mono text-[10px] text-stone-500"
          aria-label={name}
        >
          {initialsFor(name)}
        </div>
      )}

      {withRoleIcon && role && (
        <div className="pointer-events-none absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-br-xs border-b border-r border-stone-700/55 bg-stone-950/82">
          <RoleIcon role={role} className={`${roleBadgeSize} text-amber-100/90`} />
        </div>
      )}

      {withPlayerBadge && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gold/85 text-stone-950 text-center font-mono font-extrabold uppercase tracking-widest leading-tight ${playerBadgeSize}">
          <span className={playerBadgeSize}>tu</span>
        </div>
      )}
    </div>
  );
}
