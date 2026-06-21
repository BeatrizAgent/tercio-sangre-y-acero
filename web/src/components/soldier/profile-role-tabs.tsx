"use client";

import { CharacterPortrait } from "@/components/ui/character-portrait";
import { formationRoleIconPaths } from "@/lib/game-data";
import type { FormationSlot } from "@/lib/types";

export interface ProfileRoleTab {
  id: string;
  name: string;
  role: string;
  portraitAssetId: string;
  formationSlot: FormationSlot;
  level: number;
}

interface ProfileRoleTabsProps {
  profiles: ProfileRoleTab[];
  activeProfileId: string;
  onSelect: (profileId: string) => void;
  compact?: boolean;
}

export function ProfileRoleTabs({ profiles, activeProfileId, onSelect, compact = false }: ProfileRoleTabsProps) {
  return (
    <div className={`grid gap-1.5 ${compact ? "grid-cols-5" : "grid-cols-2 sm:grid-cols-5"}`}>
      {profiles.map((profile) => {
        const roleIconPath = formationRoleIconPaths[profile.formationSlot];
        const isActive = activeProfileId === profile.id;

        return (
          <button
            key={profile.id}
            onClick={() => onSelect(profile.id)}
            className={`group flex items-center rounded-xs border text-left transition-all ${
              isActive
                ? "border-gold bg-gold/10 text-gold"
                : "border-iron/70 bg-panel-soft/20 text-text-muted hover:border-gold/40 hover:text-gold"
            } ${compact ? "min-h-12 justify-center p-1" : "min-h-14 gap-2 px-2 py-1.5"}`}
            aria-label={`Ver ${profile.name}`}
            title={profile.name}
          >
            <CharacterPortrait
              assetId={profile.portraitAssetId}
              name={profile.name}
              size="sm"
              rounded="xs"
              className={`${compact ? "h-10 w-10" : "h-9 w-9"} border-iron/70`}
            >
              {roleIconPath ? (
                <span className="pointer-events-none absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-tl-xs border-l border-t border-iron/60 bg-stone-950/90">
                  <img src={roleIconPath} alt="" className="h-3 w-3 object-contain" draggable={false} />
                </span>
              ) : null}
              <span className="pointer-events-none absolute left-0 top-0 rounded-br-xs border-b border-r border-iron/60 bg-stone-950/90 px-1 font-mono text-[8px] font-bold text-gold">
                {profile.level}
              </span>
            </CharacterPortrait>
            {!compact && (
              <span className="min-w-0">
                <span className="block truncate font-mono text-[10px] font-bold uppercase tracking-wider">
                  {profile.role}
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-wider text-gold-soft">
                  Nv {profile.level}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
