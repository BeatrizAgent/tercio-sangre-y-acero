// CharacterPortrait: single source of truth for rendering a CharacterState
// portrait via getAssetPathById. Provides consistent fallback (initials),
// size variants, and an optional "tu" player badge.
//
// Previously the same pattern was inlined in stripe-card.tsx, stripe-token.tsx,
// profile-role-tabs.tsx, the RosterCard inside tercio-battle-line.tsx, and
// the FormationToken inside tercio-formation-view.tsx.

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssetPathById } from "@/lib/game-data";
import { getPlayerPortraitPathById } from "@/lib/data/player-portraits";

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
  size = "md",
  className = "",
  rounded = "xs",
  withPlayerBadge = false,
  onErrorHide = true,
  children,
}: {
  assetId: string | undefined;
  name: string;
  size?: PortraitSize;
  className?: string;
  rounded?: "xs" | "sm" | "md" | "full";
  withPlayerBadge?: boolean;
  onErrorHide?: boolean;
  children?: React.ReactNode;
}) {
  const px = SIZE_PX[size];
  const src = getPlayerPortraitPathById(assetId) ?? getAssetPathById(assetId);
  const radiusClass = rounded === "full" ? "rounded-full" : `rounded-${rounded}`;
  const playerBadgeText = size === "xs" || size === "sm" ? "text-[7px]" : "text-[8px]";
  const [loaded, setLoaded] = useState(false);
  const showSkeleton = Boolean(src) && !loaded;

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-iron bg-stone-900 shadow-inner transition-transform duration-200 ${radiusClass} ${className}`}
      style={{ width: px, height: px }}
    >
      {src ? (
        <>
          {showSkeleton && <Skeleton className="absolute inset-0" decorative />}
          <Image
            src={src}
            alt={name}
            width={px}
            height={px}
            loading="eager"
            sizes={`${px}px`}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-[transform,opacity] duration-300 hover:scale-[1.02] ${loaded ? "opacity-100" : "opacity-0"}`}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={
              (event) => {
                if (onErrorHide) {
                  event.currentTarget.style.display = "none";
                }
                setLoaded(true);
              }
            }
          />
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-mono text-[10px] text-text-muted"
          aria-label={name}
        >
          {initialsFor(name)}
        </div>
      )}

      {children}

      {withPlayerBadge && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gold/90 text-center font-mono font-extrabold uppercase tracking-widest leading-tight text-stone-950 py-0.5">
          <span className={playerBadgeText}>tu</span>
        </div>
      )}
    </div>
  );
}
