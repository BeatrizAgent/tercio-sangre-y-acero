"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Coins, TrendingUp } from "lucide-react";
import { PageTransition } from "@/components/game/page-transition";
import { Card } from "@/components/ui/card";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { TrainingSkeleton } from "@/components/skeletons/training-skeleton";
import { RecruitSwitcher } from "@/components/training/recruit-switcher";
import { StatCard } from "@/components/training/stat-card";
import { FatigueImpact } from "@/components/training/fatigue-impact";
import { RecommendationCard } from "@/components/training/recommendation-card";
import { featuredAssetPaths, trainingOptions } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";
import { useOptimisticAction } from "@/lib/hooks/use-optimistic-action";
import {
  trainCharacterStatBoostInState,
  trainCharacterStatInState,
  trainSoldierStatBoostInState,
  trainSoldierStatInState,
} from "@/lib/domain/training";
import { trainStatAction } from "@/lib/actions/training";
import { getCharacterLevel } from "@/lib/domain/character-level";
import { playCoinSound, playDefeatSound, playDrumSound } from "@/lib/sounds";
import { BOOST_GAIN } from "@/lib/data/training";
import type { StatId } from "@/lib/types";

interface NoticeState {
  text: string;
  tone: "ok" | "err";
}

export default function TrainingPage() {
  const { status } = useGameData();
  const { soldier, characters, activeCharacterId, setActiveCharacter, payTownBribe } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [pending, setPending] = useState<{ stat: StatId; mode: "step" | "boost" } | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const flash = useCallback((text: string, tone: NoticeState["tone"]) => {
    setNotice({ text, tone });
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4000);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => {
      window.clearTimeout(timer);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  const { run: runTrain } = useOptimisticAction(
    trainStatAction,
    (state, args: { stat: StatId; characterId: string; mode: "step" | "boost" }) => {
      const applyBoost = args.mode === "boost";
      const out = args.characterId
        ? applyBoost
          ? trainCharacterStatBoostInState(state, args.characterId, args.stat)
          : trainCharacterStatInState(state, args.characterId, args.stat)
        : applyBoost
          ? trainSoldierStatBoostInState(state, args.stat)
          : trainSoldierStatInState(state, args.stat);
      return out.next;
    },
    {
      onSuccess: (result, args) => {
        playDrumSound();
        const verb = args.mode === "boost" ? `+${BOOST_GAIN} (mejora)` : "+1";
        flash(`Exito ${verb}: ${result.message}`, "ok");
        setPending(null);
      },
      onError: (message) => {
        playDefeatSound();
        flash(`Error: ${message}`, "err");
        setPending(null);
      },
    },
  );

  if (!mounted || status !== "ready") {
    return (
      <PageTransition>
        <TrainingSkeleton />
      </PageTransition>
    );
  }

  if (soldier.banMissionsLeft > 0) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-xl py-12 text-center">
          <Card title="Acceso prohibido">
            <div className="space-y-6 p-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-danger/30 bg-danger/10 animate-pulse">
                <UiAssetIcon id="confirm" label="Acceso prohibido" className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="font-cinzel text-xl font-bold uppercase text-gold">Expulsado del pueblo</h3>
              </div>
              <div className="border border-iron bg-stone-900 p-3 font-mono text-xs">
                Quedan <strong className="text-danger">{soldier.banMissionsLeft}</strong> misiones de destierro.
              </div>
              <div className="space-y-3 border-t border-iron/50 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const res = payTownBribe();
                    if (res.ok) playCoinSound();
                    else playDefeatSound();
                  }}
                  disabled={soldier.coins < 50}
                  className={`blood-button w-full px-6 py-2.5 text-xs ${
                    soldier.coins < 50 ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  Sobornar al alguacil (50 doblones)
                </button>
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const activeCharacter = characters.find((character) => character.id === activeCharacterId) ?? characters[0];
  const activeLevel = getCharacterLevel(activeCharacter.stats);
  const isFatigued = activeCharacter.fatigue >= 100;

  const handleTrain = (stat: StatId, mode: "step" | "boost") => {
    setPending({ stat, mode });
    runTrain({ stat, characterId: activeCharacter.id, mode });
  };

  const handleJumpToStat = (stat: StatId) => {
    if (typeof window === "undefined") return;
    const target = document.getElementById(`stat-card-${stat}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("ring-2", "ring-gold/55");
      window.setTimeout(() => target.classList.remove("ring-2", "ring-gold/55"), 1200);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="page-header">
          <div>
            <p className="page-header__eyebrow">Maestro de armas del Tercio</p>
            <h1 className="page-header__title">Entrenamiento</h1>
            <p className="page-header__subtitle max-w-prose">
              Paga, fatiga y humor del sargento. Sin moneda no hay progreso.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BadgeStat icon="coins" label="Bolsa" value={soldier.coins} tone="text-gold" />
            <BadgeStat
              icon="fatigue"
              label="Fatiga"
              value={`${activeCharacter.fatigue}/100`}
              tone={isFatigued ? "text-danger" : activeCharacter.fatigue > 75 ? "text-ember" : "text-gold-soft"}
            />
            <BadgeStat
              icon="xp"
              label="Nivel"
              value={activeLevel}
              tone="text-gold-soft"
            />
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className={`notice ${notice.tone === "ok" ? "notice--ok" : "notice--err"}`}
          >
            {notice.text}
          </div>
        )}

        <section
          aria-label="Recluta activo"
          className="game-panel rounded-xs border border-iron bg-stone-950/70 p-3"
        >
          <div className="panel-header">
            <span className="panel-header__title">Recluta activo</span>
            <span className="panel-header__meta">{activeCharacter.role}</span>
          </div>
          <div>
            <RecruitSwitcher
              characters={characters}
              activeCharacterId={activeCharacter.id}
              onSelect={setActiveCharacter}
            />
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3 min-w-0">
            <SceneHeader
              title="Campo de instrucción"
              subtitle={activeCharacter.name}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {trainingOptions.map((option) => {
                const currentLevel = activeCharacter.stats[option.stat] ?? 0;
                const cardPending = pending?.stat === option.stat ? pending.mode : null;
                return (
                  <StatCard
                    key={option.stat}
                    option={option}
                    currentLevel={currentLevel}
                    coins={soldier.coins}
                    fatigue={activeCharacter.fatigue}
                    pending={cardPending}
                    onTrain={() => handleTrain(option.stat, "step")}
                    onBoost={() => handleTrain(option.stat, "boost")}
                  />
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <Card title="Estado del recluta" iconId="fatigue">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatusTile
                    icon={<Coins className="h-5 w-5" />}
                    label="Bolsa"
                    value={soldier.coins}
                    tone="text-gold"
                  />
                  <StatusTile
                    icon={<TrendingUp className="h-5 w-5" />}
                    label="Nivel"
                    value={activeLevel}
                    tone="text-gold-soft"
                  />
                </div>

                <FatigueImpact value={activeCharacter.fatigue} />
              </div>
            </Card>

            <Card title="Entrenamiento recomendado" iconId="training">
              <RecommendationCard character={activeCharacter} onJumpTo={handleJumpToStat} />
            </Card>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

function BadgeStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: "coins" | "fatigue" | "xp";
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xs border border-iron/70 bg-stone-900/60 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted">
      <UiAssetIcon id={icon} label={label} className="h-3.5 w-3.5" />
      <span className="text-text-muted">{label}</span>
      <span className={tone}>{value}</span>
    </span>
  );
}

function StatusTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="border border-iron bg-stone-950/65 p-3">
      <div className="mb-2 flex items-center justify-between text-text-muted">
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
        <span className={tone}>{icon}</span>
      </div>
      <div className={`font-cinzel text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function SceneHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="game-panel relative overflow-hidden rounded-xs border border-iron bg-gradient-to-b from-stone-900/85 to-stone-950/90 shadow-inner">
      <div className="relative min-h-32 border-b border-iron bg-stone-950">
        <img
          src={featuredAssetPaths.training}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45 saturate-75"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/72 to-stone-950/20" />
        <div className="relative flex min-h-32 flex-col justify-end gap-1 p-4">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="training" label="Entrenamiento" className="h-12 w-12 rounded-xs border border-gold/25 bg-black/50 p-1" />
            <div className="min-w-0">
              <h2 className="font-cinzel text-lg font-bold uppercase tracking-wider text-gold-soft">
                {title}
              </h2>
              <p className="truncate font-mono text-[10px] uppercase tracking-widest text-text-muted">
                {subtitle}
              </p>
            </div>
            <Tooltip content="Entrena con un click. +1 al atributo. Si el nivel del stat es múltiplo de 5 (o estás bajo nivel 10), también puedes Mejorar con un salto de +3." />
          </div>
        </div>
      </div>
    </div>
  );
}
