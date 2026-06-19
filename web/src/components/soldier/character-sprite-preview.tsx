"use client";

import { useEffect, useMemo, useState } from "react";
import { getAssetPathById, getSpriteSetDefinition } from "@/lib/game-data";
import type { SpriteSheetRef } from "@/lib/types";

type PreviewMode = "walk" | "pikeAttack" | "swordAttack";

const MODE_LABELS: Record<PreviewMode, string> = {
  walk: "Marcha",
  pikeAttack: "Pica",
  swordAttack: "Espada",
};

interface CharacterSpritePreviewProps {
  spriteSetId?: string;
  fallbackAssetId?: string;
  label: string;
}

export function CharacterSpritePreview({ spriteSetId, fallbackAssetId, label }: CharacterSpritePreviewProps) {
  const spriteSet = getSpriteSetDefinition(spriteSetId);
  const availableModes = useMemo(
    () => (spriteSet ? (Object.keys(spriteSet.frames) as PreviewMode[]).filter((mode) => spriteSet.frames[mode]) : []),
    [spriteSet],
  );
  const [mode, setMode] = useState<PreviewMode>("walk");
  const [frame, setFrame] = useState(0);

  const selectedMode = availableModes.includes(mode) ? mode : availableModes[0];
  const sheet = spriteSet?.frames[selectedMode];
  const sheetPath = getAssetPathById(sheet?.assetId);
  const fallbackPath = getAssetPathById(fallbackAssetId);

  useEffect(() => {
    if (!sheet) return;
    const delay = Math.max(80, 1000 / sheet.fps);
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % sheet.frames), delay);
    return () => window.clearInterval(timer);
  }, [sheet]);

  if (!sheet || !sheetPath) {
    return (
      <div className="relative h-full min-h-48 overflow-hidden rounded-xs border border-iron bg-stone-950">
        {fallbackPath ? (
          <img src={fallbackPath} alt={label} className="h-full w-full object-contain object-bottom p-2" />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase text-muted">Sin sprite</div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xs border border-iron bg-stone-950 p-2">
      <div className="relative h-64 overflow-hidden rounded-xs bg-black/25">
        <SpriteSheetFrame sheet={sheet} src={sheetPath} frame={frame} label={label} />
      </div>
      {availableModes.length > 1 && (
        <div className="mt-2 grid grid-cols-3 gap-1">
          {availableModes.map((entry) => (
            <button
              key={entry}
              onClick={() => {
                setMode(entry);
                setFrame(0);
              }}
              className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                selectedMode === entry
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-iron bg-stone-900 text-text-muted hover:border-gold/50 hover:text-gold"
              }`}
            >
              {MODE_LABELS[entry]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SpriteSheetFrame({ sheet, src, frame, label }: { sheet: SpriteSheetRef; src: string; frame: number; label: string }) {
  const scale = 0.34;
  const frameWidth = sheet.frameWidth * scale;
  const frameHeight = sheet.frameHeight * scale;
  const width = sheet.frameWidth * sheet.frames;
  return (
    <div className="absolute inset-0">
      <div
        className="absolute bottom-2 left-1/2 overflow-hidden"
        style={{
          width: `${frameWidth}px`,
          height: `${frameHeight}px`,
          transform: "translateX(-50%)",
        }}
      >
        <img
          src={src}
          alt={label}
          className="absolute bottom-0 left-0 max-w-none"
          style={{
            width: `${width * scale}px`,
            height: `${frameHeight}px`,
            transform: `translateX(-${frame * frameWidth}px)`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
