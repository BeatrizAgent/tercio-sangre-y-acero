// RecruitmentCard: dense per-candidate card used by /recruitment.
// Displays all details (stats, costs, hook, fatigue, role) directly on a single card.
// No modals are used.

"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { CharacterPortrait } from "@/components/ui/character-portrait";
import { RoleIcon } from "@/components/ui/role-icon";
import { FatigueBar, type StatTone } from "@/components/ui/stat-chip";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import {
  candidateAffordability,
  candidatePowerScore,
  type RecruitmentCandidate,
} from "@/lib/data/recruitment";
import { getRankName } from "@/lib/data/ranks";
import { formationRoleIconPaths } from "@/lib/data/ui-paths";
import { STAT_INFO } from "@/lib/stats";
import type { Soldier, StatId } from "@/lib/types";

const STAT_ORDER: readonly StatId[] = [
  "pike",
  "sword",
  "arquebus",
  "discipline",
  "vigor",
  "cunning",
  "command",
];

const STAT_SHORT: Record<StatId, string> = {
  pike: "Pic",
  sword: "Esp",
  arquebus: "Arc",
  discipline: "Dis",
  vigor: "Vig",
  cunning: "Ast",
  command: "Man",
};

const TONE_CLASS: Record<StatTone, string> = {
  default: "border-iron/70 bg-stone-950/60 text-text-muted",
  gold: "border-gold/45 bg-gold/10 text-gold-soft",
  success: "border-success/40 bg-success/12 text-success",
  danger: "border-danger/40 bg-danger/12 text-danger",
  ember: "border-ember/45 bg-ember/12 text-ember",
  stone: "border-stone-700/70 bg-stone-900/55 text-amber-100/85",
};

type CostKind = "coins" | "honor" | "rank";

function statTone(value: number): StatTone {
  if (value >= 5) return "gold";
  if (value >= 3) return "default";
  return "default";
}

export function RecruitmentCard({
  candidate,
  soldier,
  recruited,
  recruitmentBlockedReason,
  onRecruit,
}: {
  candidate: RecruitmentCandidate;
  soldier: Soldier;
  recruited: boolean;
  recruitmentBlockedReason?: string | null;
  onRecruit: () => void;
}) {
  const { character, cost, hook } = candidate;
  const affordability = candidateAffordability(soldier, candidate);
  const power = candidatePowerScore(candidate);
  const canAfford = affordability.canAfford;
  const canRecruit = canAfford && !recruitmentBlockedReason;
  const blockedReason = recruitmentBlockedReason ?? (!canAfford
    ? formatMissingCost(affordability.missing)
    : null);
  const costLabel = formatCostShort(cost);

  const totalMissing =
    affordability.missing.coins + affordability.missing.honor + affordability.missing.reputation;

  return (
    <article
      data-testid={`recruit-card-${candidate.id}`}
      className={`recruit-card game-panel flex min-w-0 flex-col gap-2 rounded-xs border p-2.5 transition ${
        recruited
          ? "border-success/40 bg-black/25 opacity-70"
          : canRecruit
            ? "border-iron/70 hover:border-gold/45 hover:shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
            : "border-iron/60 bg-black/15 opacity-90"
      }`}
    >
      <header className="flex min-w-0 items-start gap-2.5">
        <CharacterPortrait
          assetId={character.portraitAssetId}
          name={character.name}
          size="sm"
          rounded="xs"
          className="border-gold/30"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1 text-gold-soft">
            <RoleIcon role={character.role} className="h-3 w-3 shrink-0" />
            <h3 className="min-w-0 flex-1 truncate font-cinzel text-xs font-extrabold uppercase tracking-wide text-gold">
              {character.name}
            </h3>
          </div>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1">
            <span className="rounded-xs border border-iron/70 bg-stone-900/55 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-text-muted">
              {character.role}
            </span>
            <span className="rounded-xs border border-gold/35 bg-gold/10 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-gold-soft">
              {getRankName(character.rank)}
            </span>
            {recruited && (
              <span className="inline-flex items-center gap-0.5 rounded-xs border border-success/40 bg-success/12 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-success">
                <Check className="h-2.5 w-2.5" />
                En el tercio
              </span>
            )}
          </div>
        </div>
      </header>

      <p className="text-[10px] leading-snug italic text-text-muted min-h-[32px] line-clamp-2">
        &ldquo;{hook}&rdquo;
      </p>

      <div
        className="grid min-w-0 grid-cols-4 gap-1"
        role="group"
        aria-label="Atributos del recluta"
      >
        {STAT_ORDER.map((stat) => (
          <StatPill
            key={stat}
            statId={stat}
            label={STAT_SHORT[stat]}
            value={character.stats[stat] ?? 0}
          />
        ))}
        <span
          className="inline-flex w-full items-center justify-center gap-0.5 rounded-xs border border-gold/45 bg-gold/10 px-1 py-0.5 font-mono text-[10px] font-extrabold text-gold-soft"
          title={`Poder total: ${power} (Suma de los 7 atributos)`}
        >
          <span className="text-[8px] uppercase text-text-muted">Σ</span>
          <span>{power}</span>
        </span>
      </div>

      <div
        className="grid min-w-0 grid-cols-3 gap-1"
        role="group"
        aria-label="Coste del recluta"
      >
        <CostChip
          kind="coins"
          label="Doblones"
          need={cost.coins ?? 0}
          have={soldier.coins}
          missing={affordability.missing.coins}
        />
        <CostChip
          kind="honor"
          label="Honor"
          need={cost.honor ?? 0}
          have={soldier.honor}
          missing={affordability.missing.honor}
        />
        <CostChip
          kind="rank"
          label="Fama"
          need={cost.reputation ?? 0}
          have={soldier.reputation}
          missing={affordability.missing.reputation}
        />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-iron/40 pt-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-wider text-text-muted">
            Fat
          </span>
          <FatigueBar value={character.fatigue} className="min-w-0 flex-1" showLabel />
        </div>
        <div className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-text-muted">
          <img
            src={formationRoleIconPaths.banquillo}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-3 w-3 object-contain"
            draggable={false}
          />
          Banquillo
        </div>
      </div>

      {recruited ? (
        <Link
          href="/company"
          className="iron-button inline-flex min-h-9 items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider"
        >
          En la formación →
        </Link>
      ) : (
        <button
          type="button"
          disabled={!canRecruit}
          onClick={(e) => {
            e.stopPropagation();
            onRecruit();
          }}
          aria-label={
            canRecruit
              ? `Reclutar a ${character.name} por ${costLabel}`
              : `No puedes reclutar: ${blockedReason}`
          }
          className={`min-h-9 w-full cursor-pointer border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition ${
            canRecruit
              ? "blood-button"
              : "cursor-not-allowed border-iron bg-stone-950 text-muted"
          }`}
        >
          {canRecruit
            ? `Reclutar · ${costLabel}`
            : (blockedReason ?? "Reclutar")}
        </button>
      )}

      {!canAfford && !recruited && totalMissing > 0 && (
        <p className="-mt-1 text-center font-mono text-[9px] uppercase tracking-wider text-danger">
          Te faltan {totalMissing === 1 ? "1 recurso" : `${totalMissing} recursos`} para cerrar el trato
        </p>
      )}
    </article>
  );
}

function StatPill({
  statId,
  label,
  value,
}: {
  statId: StatId;
  label: string;
  value: number;
}) {
  const info = STAT_INFO[statId];
  const tone = statTone(value);
  const tooltip = `${info.name}: ${info.description}`;
  return (
    <span
      title={tooltip}
      className={`inline-flex w-full items-center justify-center gap-0.5 rounded-xs border px-1 py-0.5 font-mono text-[10px] font-bold ${TONE_CLASS[tone]}`}
    >
      <span className="text-[8px] uppercase text-text-muted">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function CostChip({
  kind,
  label,
  need,
  have,
  missing,
}: {
  kind: CostKind;
  label: string;
  need: number;
  have: number;
  missing: number;
}) {
  if (need === 0) {
    return (
      <div
        className="flex min-w-0 items-center justify-center gap-1 rounded-xs border border-iron/40 bg-stone-950/45 px-1 py-1 opacity-55"
        title={`${label} no requerido`}
      >
        <UiAssetIcon id={kind} label={label} className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-mono text-[9px] text-text-muted">{label.slice(0, 4)}</span>
      </div>
    );
  }
  const ok = missing === 0;
  const toneClass = ok
    ? "border-success/45 bg-success/12 text-success"
    : "border-danger/45 bg-danger/12 text-danger";
  const tooltip = ok
    ? `${label}: tienes ${have}, pagas ${need}.`
    : `${label}: tienes ${have}, faltan ${missing} para pagar ${need}.`;
  return (
    <div
      title={tooltip}
      className={`flex min-w-0 items-center justify-center gap-1 rounded-xs border px-1 py-1 ${toneClass}`}
    >
      <UiAssetIcon id={kind} label={label} className="h-3.5 w-3.5 shrink-0" />
      <span className="font-mono text-[10px] font-bold">{need}</span>
      {!ok && <span className="font-mono text-[8px] font-bold">−{missing}</span>}
    </div>
  );
}

function formatCostShort(cost: { coins?: number; honor?: number; reputation?: number }): string {
  const parts: string[] = [];
  if (cost.coins) parts.push(`${cost.coins} doblones`);
  if (cost.honor) parts.push(`${cost.honor} honor`);
  if (cost.reputation) parts.push(`${cost.reputation} fama`);
  return parts.length > 0 ? parts.join(" + ") : "Gratis";
}

function formatMissingCost(missing: { coins: number; honor: number; reputation: number }): string {
  const parts: string[] = [];
  if (missing.coins) parts.push(`${missing.coins} doblones`);
  if (missing.honor) parts.push(`${missing.honor} honor`);
  if (missing.reputation) parts.push(`${missing.reputation} fama`);
  return parts.length > 0 ? `Falta ${parts.join(" + ")}` : "Falta paga";
}
