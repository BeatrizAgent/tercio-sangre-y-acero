// RecommendationCard: 3 training suggestions the page generates from
// recommendTraining(). Each item jumps (via in-page anchor) to the
// corresponding StatCard.

"use client";

import { trainingAssetPaths } from "@/lib/game-data";
import { STAT_LABELS, recommendTraining } from "@/lib/domain/training-preview";
import type { CharacterState, StatId } from "@/lib/types";

export function RecommendationCard({
  character,
  onJumpTo,
}: {
  character: CharacterState;
  onJumpTo: (stat: StatId) => void;
}) {
  const tips = recommendTraining(character, 3);
  return (
    <div className="border border-iron bg-stone-950/55 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-gold-soft">
          Recomendado
        </h3>
        <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
          según tu rol
        </span>
      </div>
      <ul className="space-y-1.5">
        {tips.map((tip) => {
          const covered = tip.deficit <= 0;
          return (
            <li key={tip.stat}>
              <button
                type="button"
                onClick={() => onJumpTo(tip.stat)}
                data-testid={`recommend-${tip.stat}`}
                className="group flex w-full items-center gap-2 rounded-xs border border-iron/50 bg-stone-900/40 p-2 text-left transition-colors hover:border-gold/45 hover:bg-stone-900/70"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs border border-iron/60 bg-stone-950 p-1">
                  <img
                    src={trainingAssetPaths[tip.stat]}
                    alt=""
                    className="h-full w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="font-cinzel text-xs font-bold uppercase tracking-wide text-text group-hover:text-gold-soft">
                      {STAT_LABELS[tip.stat]}
                    </span>
                    {covered && (
                      <span className="font-mono text-[9px] uppercase tracking-widest text-success">cubierto</span>
                    )}
                  </span>
                  <span className="block truncate font-mono text-[10px] leading-snug text-text-muted">
                    {tip.reason}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
