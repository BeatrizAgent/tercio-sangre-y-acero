// StatCard: per-stat training card. Renders level + progress bar +
// bonus preview + cost row + Entrenar / Mejorar buttons. Mirrors the
// per-stat card in DESIGN/entrenamiento.png.

"use client";

import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { GladiatusBar } from "@/components/ui/gladiatus-bar";
import { STAT_FLAVOR, STAT_LABELS, previewStatBonus, statDescriptor } from "@/lib/domain/training-preview";
import { trainingAssetPaths } from "@/lib/game-data";
import { boostCostFor, isBoostMilestone, type TrainingOption } from "@/lib/data/training";
import { BOOST_GAIN } from "@/lib/data/training";

const STAT_MAX = 100;

export interface StatCardProps {
  option: TrainingOption;
  currentLevel: number;
  coins: number;
  fatigue: number;
  pending: "step" | "boost" | null;
  onTrain: () => void;
  onBoost: () => void;
}

export function StatCard({ option, currentLevel, coins, fatigue, pending, onTrain, onBoost }: StatCardProps) {
  const stat = option.stat;
  const preview = previewStatBonus(stat, currentLevel);
  const descriptor = statDescriptor(stat);
  const stepCostCoins = option.cost.coins;
  const stepCostFatigue = option.fatigue;
  const boost = boostCostFor(option);
  const canAffordStep = coins >= stepCostCoins;
  const canAffordBoost = coins >= boost.coins;
  const fitsStep = fatigue + stepCostFatigue <= 100;
  const fitsBoost = fatigue + boost.fatigue <= 100;
  const isExhausted = fatigue >= 100;
  const stepDisabled = isExhausted || !canAffordStep || !fitsStep || pending !== null;
  const boostDisabled = isExhausted || !canAffordBoost || !fitsBoost || pending !== null || !isBoostMilestone(currentLevel);
  const stepLabel = pending === "step" ? "Entrenando" : isExhausted ? "Agotado" : !fitsStep ? "Sin margen" : !canAffordStep ? "Sin paga" : "Entrenar";
  const boostLabel = pending === "boost" ? "Mejorando" : !fitsBoost ? "Sin margen" : !canAffordBoost ? "Sin paga" : `Mejorar +${BOOST_GAIN}`;

  return (
    <article
      id={`stat-card-${stat}`}
      data-stat={stat}
      className="game-panel relative flex flex-col gap-3 rounded-xs border border-iron bg-stone-950/60 p-4 transition-colors hover:border-gold/35"
    >
      <header className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-iron bg-stone-950 p-1.5">
          <img
            src={trainingAssetPaths[stat]}
            alt={descriptor.primary}
            className="h-full w-full object-contain"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-cinzel text-lg font-bold uppercase tracking-wide text-text">
              {STAT_LABELS[stat]}
            </h3>
            <Tooltip content={option.description} />
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-text-muted">
            {STAT_FLAVOR[stat]}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center pl-1 text-right leading-none">
          <span className="font-mono text-[8px] uppercase tracking-widest text-text-muted">Nv</span>
          <span className="font-cinzel text-xl font-extrabold text-gold">
            {currentLevel}
          </span>
        </div>
      </header>

      <div className="space-y-1">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-text-muted">
          <span>Progreso</span>
          <span>
            {currentLevel} / {STAT_MAX}
          </span>
        </div>
        <GladiatusBar type="xp" value={currentLevel} max={STAT_MAX} className="h-2" />
      </div>

      <div className="border border-iron/60 bg-stone-950/55 p-2.5 text-xs leading-relaxed">
        <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">Bonificación</div>
        <ul className="space-y-0.5 text-text">
          <li className="flex items-baseline justify-between gap-2">
            <span className="shrink-0 text-text-muted">Primario</span>
            <span className="truncate font-mono text-gold-soft font-bold">{preview.current.primaryText}</span>
          </li>
          <li className="flex items-baseline justify-between gap-2">
            <span className="shrink-0 text-text-muted">Secund.</span>
            <span className="truncate font-mono text-gold-soft font-bold">{preview.current.secondaryText}</span>
          </li>
        </ul>
        <div className="mt-1.5 flex items-baseline gap-1 font-mono text-[9px] uppercase tracking-widest text-text-muted/80">
          <span className="shrink-0">+1 niv:</span>
          <span className="truncate text-success font-bold">+{preview.next.primary - preview.current.primary}</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 font-mono text-[10px]">
        <CostRow
          icon="coins"
          label="Coste"
          value={stepCostCoins}
          can={canAffordStep}
        />
        <CostRow
          icon="fatigue"
          label="Fatiga"
          value={`+${stepCostFatigue}`}
          can={fitsStep}
        />
      </dl>

      <div className="mt-auto grid grid-cols-[1fr_auto] gap-1.5">
        <button
          type="button"
          onClick={onTrain}
          disabled={stepDisabled}
          data-testid={`train-step-${stat}`}
          aria-label={`Entrenar ${STAT_LABELS[stat]}`}
          className="blood-button min-h-9 w-full whitespace-nowrap text-[10px] font-bold uppercase tracking-wider"
        >
          {stepLabel}
        </button>
        {isBoostMilestone(currentLevel) && (
          <button
            type="button"
            onClick={onBoost}
            disabled={boostDisabled}
            data-testid={`train-boost-${stat}`}
            aria-label={`Mejorar ${STAT_LABELS[stat]} (+${BOOST_GAIN})`}
            title={`+${BOOST_GAIN} por ${boost.coins} monedas, +${boost.fatigue} fatiga`}
            className="iron-button min-h-9 w-full whitespace-nowrap text-[10px] font-bold uppercase tracking-wider sm:w-auto sm:px-3"
          >
            +{BOOST_GAIN}
          </button>
        )}
      </div>
    </article>
  );
}

function CostRow({
  icon,
  label,
  value,
  can,
}: {
  icon: "coins" | "fatigue" | "xp";
  label: string;
  value: number | string;
  can: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-1 border border-iron/60 bg-stone-950/45 px-2 py-1.5">
      <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-text-muted">
        <UiAssetIcon id={icon} label={label} className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={`font-mono text-[12px] font-bold ${can ? "text-gold-soft" : "text-danger"}`}>
        {value}
      </span>
    </div>
  );
}
