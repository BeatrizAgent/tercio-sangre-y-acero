"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, Lock, UserPlus } from "lucide-react";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
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
    <article className="overflow-hidden rounded-xs border border-iron bg-panel shadow-md">
      <div className="grid grid-cols-[112px_minmax(0,1fr)]">
        <div className="relative min-h-[156px] bg-stone-950">
          {portrait ? (
            <Image
              src={portrait}
              alt={candidate.character.name}
              width={224}
              height={280}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[11px] text-text-muted">
              {candidate.character.name.slice(0, 2)}
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded-xs border border-stone-700/70 bg-stone-950/82 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-gold">
            {candidate.character.rank}
          </span>
        </div>

        <div className="flex min-w-0 flex-col p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-cinzel text-sm font-bold uppercase leading-snug tracking-[0.08em] text-gold">
                {candidate.character.name}
              </h2>
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-muted">
                {candidate.character.role}
              </p>
            </div>
            {recruited && (
              <span className="inline-flex items-center gap-1 rounded-xs border border-success/45 bg-success/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-success">
                <Check className="h-3 w-3" />
                Tercio
              </span>
            )}
          </div>

          <p className="mt-2 min-h-10 font-serif text-[11px] italic leading-snug text-text-muted">
            {candidate.hook}
          </p>

          <div className="mt-2 grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
            <Stat label="Pica" value={candidate.character.stats.pike} />
            <Stat label="Fuego" value={candidate.character.stats.arquebus} />
            <Stat label="Disc" value={candidate.character.stats.discipline} />
            <Stat label="Mando" value={candidate.character.stats.command} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <Cost icon="coins" label="Dinero" value={candidate.cost.coins} />
            <Cost icon="honor" label="Honor" value={candidate.cost.honor} />
            <Cost icon="rank" label="Fama" value={candidate.cost.reputation} />
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={onRecruit}
            className={`mt-3 inline-flex items-center justify-center gap-2 rounded-xs border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
              disabled
                ? "cursor-not-allowed border-iron/60 bg-stone-950/40 text-text-muted"
                : "border-gold/55 bg-gold/12 text-gold hover:bg-gold/18"
            }`}
          >
            {disabled ? <Lock className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
            {blockedReason ?? "Reclutar"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-xs border border-iron/60 bg-stone-950/45 px-1 py-1">
      <span className="block text-[7px] uppercase text-text-muted">{label}</span>
      <span className="text-gold">{value}</span>
    </span>
  );
}

function Cost({
  icon,
  label,
  value,
}: {
  icon: "coins" | "honor" | "rank";
  label: string;
  value: number | undefined;
}) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-xs border border-iron/60 bg-stone-950/45 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-text">
      <UiAssetIcon id={icon} label={label} className="h-3 w-3" />
      {value}
    </span>
  );
}
