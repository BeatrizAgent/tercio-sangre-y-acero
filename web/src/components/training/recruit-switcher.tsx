// RecruitSwitcher: row of buttons that let the player pick which company
// member is currently training. The player character is always marked
// with a "TU" badge so it's obvious whose purse is paying and whose
// fatigue is climbing.

"use client";

import { CharacterPortrait } from "@/components/ui/character-portrait";
import { FatigueBar } from "@/components/ui/stat-chip";
import type { CharacterState } from "@/lib/types";
import { PLAYER_CHARACTER_ID } from "@/lib/domain/player-character";

export function RecruitSwitcher({
  characters,
  activeCharacterId,
  onSelect,
}: {
  characters: CharacterState[];
  activeCharacterId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {characters.map((character) => {
        const isActive = character.id === activeCharacterId;
        const isPlayer = character.id === PLAYER_CHARACTER_ID;
        return (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelect(character.id)}
            aria-pressed={isActive}
            aria-label={`Entrenar a ${character.name}`}
            className={`flex min-h-20 items-center gap-2 rounded-xs border-2 p-2 text-left transition-all relative overflow-hidden ${
              isActive
                ? "border-gold bg-gradient-to-b from-panel-raised to-panel shadow-[0_0_10px_rgba(201,162,79,0.25)] text-gold-soft"
                : "border-iron/80 bg-gradient-to-b from-stone-900/80 to-stone-950/90 text-text-muted hover:border-gold/45 hover:text-gold-soft"
            }`}
          >
            {isActive && (
              <div className="pointer-events-none absolute top-0 right-0 w-2 h-2 bg-gold rotate-45 translate-x-1 -translate-y-1" />
            )}
            <CharacterPortrait
              assetId={character.portraitAssetId}
              name={character.name}
              size="sm"
              withPlayerBadge={isPlayer}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1">
                <span className="block truncate font-cinzel text-xs font-bold uppercase tracking-wide">
                  {character.name}
                </span>
                {isPlayer && !isActive && (
                  <span className="font-mono text-[8px] uppercase tracking-widest text-gold-soft/80">
                    tu
                  </span>
                )}
              </span>
              <span className="block font-mono text-[9px] uppercase text-text-muted mt-0.5 truncate">
                {character.role}
              </span>
              <FatigueBar
                value={character.fatigue}
                showLabel
                className="mt-1"
                ariaLabel={`Fatiga de ${character.name}`}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
