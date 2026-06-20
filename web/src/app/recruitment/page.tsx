"use client";

import { useMemo, useState } from "react";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { NpcOfferFrame } from "@/components/game/visual-offers";
import { getAssetPathById } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import {
  canRecruitCandidate,
  recruitmentCandidates,
  type RecruitmentCandidate,
} from "@/lib/recruitment";
import { playCoinSound, playPageSound } from "@/lib/sounds";

export default function RecruitmentPage() {
  const { soldier, characters, recruitCandidate } = useGameStore();
  const [notice, setNotice] = useState<string | null>(null);
  const recruitedIds = useMemo(
    () => new Set(characters.map((character) => character.id)),
    [characters],
  );

  function handleRecruit(candidate: RecruitmentCandidate) {
    const result = recruitCandidate(candidate.id);
    if (result.ok) playCoinSound();
    else playPageSound();
    setNotice(result.message);
    window.setTimeout(() => setNotice(null), 2400);
  }

  return (
    <PageTransition>
      <div className="space-y-3">
        {notice && (
          <div className="rounded-xs border border-gold/45 bg-gold/10 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-gold">
            {notice}
          </div>
        )}

        <header className="rounded-xs border border-iron/70 bg-panel p-3 shadow-md">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gold-soft/75">
                Plaza de enganche
              </span>
              <h1 className="mt-1 font-cinzel text-xl font-bold uppercase tracking-[0.14em] text-gold">
                Reclutamiento
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
              <ResourceBadge icon="coins" label="Dinero" value={soldier.coins} />
              <ResourceBadge icon="honor" label="Honor" value={soldier.honor} />
              <ResourceBadge icon="rank" label="Fama" value={soldier.reputation} />
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {recruitmentCandidates.map((candidate) => {
            const recruited = recruitedIds.has(candidate.character.id);
            const allowed = canRecruitCandidate(soldier, candidate);
            const disabled = recruited || !allowed.ok;
            return (
              <RecruitCard
                key={candidate.id}
                candidate={candidate}
                recruited={recruited}
                blockedReason={recruited ? "Ya reclutado" : allowed.ok ? null : allowed.message}
                disabled={disabled}
                onRecruit={() => handleRecruit(candidate)}
              />
            );
          })}
        </section>
      </div>
    </PageTransition>
  );
}

function ResourceBadge({
  icon,
  label,
  value,
}: {
  icon: "coins" | "honor" | "rank";
  label: string;
  value: number;
}) {
  return (
    <span className="flex min-w-24 items-center gap-2 rounded-xs border border-iron/70 bg-stone-950/55 px-2 py-1.5">
      <UiAssetIcon id={icon} label={label} className="h-4 w-4" />
      <span>
        <span className="block text-[8px] uppercase tracking-wider text-text-muted">{label}</span>
        <span className="text-gold">{value}</span>
      </span>
    </span>
  );
}

function RecruitCard({
  candidate,
  recruited,
  blockedReason,
  disabled,
  onRecruit,
}: {
  candidate: RecruitmentCandidate;
  recruited: boolean;
  blockedReason: string | null;
  disabled: boolean;
  onRecruit: () => void;
}) {
  const portrait = getAssetPathById(candidate.character.portraitAssetId);

  return (
    <NpcOfferFrame
      model={{
        id: candidate.id,
        title: candidate.character.name,
        subtitle: candidate.character.rank,
        portraitSrc: portrait ?? "",
        offers: [
          { id: "pike", iconId: "missions", label: "Pica", value: candidate.character.stats.pike, tooltip: candidate.hook },
          { id: "fire", iconId: "risk", label: "Fuego", value: candidate.character.stats.arquebus, tooltip: candidate.character.role },
          { id: "coins", iconId: "coins", label: "Dinero", value: candidate.cost.coins ?? 0, tooltip: "Coste en doblones" },
          { id: "honor", iconId: "honor", label: "Honor", value: candidate.cost.honor ?? 0, tooltip: "Honor requerido" },
        ],
        primaryAction: {
          id: "recruit",
          iconId: recruited ? "confirm" : "rank",
          label: recruited ? "Tercio" : blockedReason ?? "Reclutar",
          disabled,
          onClick: onRecruit,
          tooltip: blockedReason ?? "Reclutar",
        },
      }}
    />
  );
}
