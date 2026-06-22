"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Coins, TrendingUp } from "lucide-react";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { Card, Badge } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { TrainingSkeleton } from "@/components/skeletons/training-skeleton";
import { featuredAssetPaths, getAssetPathById, trainingAssetPaths, trainingOptions } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";
import { useOptimisticAction } from "@/lib/hooks/use-optimistic-action";
import { trainCharacterStatInState } from "@/lib/domain/training";
import { trainStatAction } from "@/lib/actions/training";
import { getCharacterLevel } from "@/lib/domain/character-level";
import { playCoinSound, playDefeatSound, playDrumSound } from "@/lib/sounds";
import type { StatId } from "@/lib/types";

const statLabels: Record<StatId, string> = {
  pike: "Pica",
  sword: "Espada",
  arquebus: "Arcabuz",
  discipline: "Disciplina",
  vigor: "Vigor",
  cunning: "Astucia",
  command: "Mando",
};

const statFlavor: Record<StatId, string> = {
  pike: "Formacion cerrada, hombros duros, asta firme.",
  sword: "Patio de armas, acero romo, golpes repetidos.",
  arquebus: "Mecha, polvora humeda y pulso paciente.",
  discipline: "Orden, castigo, obediencia bajo barro.",
  vigor: "Marcha cargada, hambre, lluvia y botas rotas.",
  cunning: "Lectura del terreno y trato con gente torcida.",
  command: "Voz de mando, estandarte alto, hombres cansados.",
};

function formatCost(coins: number, xp: number) {
  if (xp > 0) return `${coins} doblones + ${xp} XP`;
  return `${coins} doblones`;
}

export default function TrainingPage() {
  const { status } = useGameData();
  const { soldier, characters, activeCharacterId, setActiveCharacter, payTownBribe } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const { run: runTrain, pending: trainPending } = useOptimisticAction(
    trainStatAction,
    (state, args: { stat: StatId; characterId: string }) =>
      trainCharacterStatInState(state, args.characterId, args.stat).next,
    {
      successMessage: (result) => result.message,
      onSuccess: (result) => {
        playDrumSound();
        setMessage({ text: `Exito: ${result.message}`, isError: false });
        window.setTimeout(() => setMessage(null), 4000);
      },
      onError: (message) => {
        playDefeatSound();
        setMessage({ text: `Error: ${message}`, isError: true });
        window.setTimeout(() => setMessage(null), 4000);
      },
    },
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

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
                  onClick={() => {
                    const res = payTownBribe();
                    if (res.ok) playCoinSound();
                    else playDefeatSound();
                  }}
                  disabled={soldier.coins < 50}
                  className={`cursor-pointer border px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                    soldier.coins >= 50
                      ? "border-gold bg-gold/15 text-gold hover:bg-gold/25"
                      : "cursor-not-allowed border-iron bg-stone-900 text-muted"
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

  const handleTrain = (stat: StatId) => {
    runTrain({ stat, characterId: activeCharacter.id });
  };

  const isFatigued = activeCharacter.fatigue >= 100;
  const activeLevel = getCharacterLevel(activeCharacter.stats);

  return (
    <PageTransition>
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-iron pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blood-bright">
              Maestro de armas del Tercio
            </p>
            <h1 className="font-cinzel text-2xl font-extrabold uppercase tracking-wider text-gold md:text-3xl">
              Entrenamiento
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="gold">{soldier.coins} doblones</Badge>
            <Badge variant={isFatigued ? "danger" : "default"}>{activeCharacter.fatigue}/100 fatiga</Badge>
          </div>
        </header>

        {message && (
          <div
            className={`border p-3 font-mono text-xs transition-all ${
              message.isError
                ? "border-danger bg-danger/20 text-danger animate-bounce"
                : "border-success bg-success/20 text-success"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="grid gap-5">
          <div className="game-panel rounded-xs border border-iron bg-stone-950/70 p-3">
            <div className="mb-2 flex items-center justify-between border-b border-iron/50 pb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gold-soft">
                Recluta activo
              </span>
              <span className="font-mono text-[10px] uppercase text-text-muted">{activeCharacter.role}</span>
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              {characters.map((character) => {
                const portrait = getAssetPathById(character.portraitAssetId);
                const isActive = character.id === activeCharacter.id;
                const level = getCharacterLevel(character.stats);
                return (
                  <button
                    key={character.id}
                    onClick={() => setActiveCharacter(character.id)}
                    className={`flex min-h-20 items-center gap-2 rounded-xs border p-2 text-left transition-all ${
                      isActive
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-iron bg-stone-900/55 text-text-muted hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    <span className="h-14 w-12 shrink-0 overflow-hidden rounded-xs border border-iron bg-black/35">
                      {portrait && <img src={portrait} alt="" className="h-full w-full object-cover object-top" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-cinzel text-sm font-bold uppercase tracking-wide">
                        {character.name}
                      </span>
                      <span className="block font-mono text-[10px] uppercase text-text-muted">
                        Nv {level} - {character.fatigue}/100 fatiga
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="game-panel overflow-hidden rounded-xs border border-iron bg-linear-to-b from-stone-900/85 to-stone-950/90 shadow-inner">
            <div className="relative min-h-40 border-b border-iron bg-stone-950">
              <Image
                src={featuredAssetPaths.training}
                alt=""
                fill
                fetchPriority="high"
                sizes="100vw"
                className="object-cover opacity-45 saturate-75"
              />
              <div className="absolute inset-0 bg-linear-to-r from-stone-950 via-stone-950/72 to-stone-950/20" />
              <div className="relative flex min-h-40 flex-col justify-end gap-2 p-5">
                <div className="flex items-center gap-3">
                  <UiAssetIcon id="training" label="Entrenamiento" className="h-14 w-14 rounded-xs border border-gold/25 bg-black/50 p-1" />
                  <div>
                    <h2 className="font-cinzel text-xl font-bold uppercase tracking-wider text-gold-soft">
                      Campo de instruccion
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden grid-cols-[70px_minmax(150px,1fr)_72px_110px_92px_112px] gap-2 border-b border-iron bg-black/25 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted lg:grid">
              <span>Escuela</span>
              <span>Atributo</span>
              <span className="text-center">Actual</span>
              <span>Progreso</span>
              <span>Coste</span>
              <span className="text-center">Accion</span>
            </div>

            <div className="divide-y divide-iron/70">
              {trainingOptions.map((option) => {
                const currentVal = activeCharacter.stats[option.stat] ?? 0;
                const costCoins = option.cost.coins;
                const costXp = option.cost.xp;
                const canAfford = soldier.coins >= costCoins && soldier.xp >= costXp;
                const disabled = !canAfford || isFatigued;
                const progress = Math.min(100, (currentVal / 25) * 100);

                return (
                  <article
                    key={option.stat}
                    className="grid gap-3 bg-background/38 p-3 transition hover:bg-panel-soft/25 lg:grid-cols-[70px_minmax(150px,1fr)_72px_110px_92px_112px] lg:items-center"
                  >
                    <div className="asset-icon-frame h-16 w-16 overflow-hidden rounded-xs border border-iron bg-stone-950 p-1.5">
                      <img
                        src={trainingAssetPaths[option.stat]}
                        alt=""
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-cinzel text-base font-bold uppercase tracking-wide text-text">
                          {statLabels[option.stat] ?? option.name}
                        </h3>
                        <Tooltip content={option.description} />
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-gold-soft">
                        {option.name}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-text-muted">
                        {statFlavor[option.stat] ?? option.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border border-iron bg-stone-950/65 px-3 py-2 lg:block lg:text-center">
                      <span className="font-mono text-[10px] uppercase text-muted lg:hidden">Actual</span>
                      <span className="font-cinzel text-2xl font-bold text-gold">{currentVal}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between font-mono text-[10px] text-muted">
                        <span>Nivel</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="stat-bar h-2.5 rounded-xs">
                        <div className="stat-bar-fill-gold h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px] lg:block">
                      <span className="text-muted lg:hidden">Coste</span>
                      <span className={canAfford ? "text-gold-soft" : "text-danger"}>
                        {formatCost(costCoins, costXp)}
                      </span>
                      <span className="text-muted lg:hidden">Fatiga</span>
                      <span className="text-ember lg:mt-1 lg:block">+{option.fatigue}</span>
                    </div>

                    <button
                      onClick={() => handleTrain(option.stat)}
                      disabled={disabled}
                      className={`min-h-10 w-full cursor-pointer border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                        disabled
                          ? "cursor-not-allowed border-iron bg-stone-950 text-muted"
                          : "border-blood-bright bg-blood text-text hover:bg-blood-bright hover:text-white"
                      }`}
                    >
                      {isFatigued ? "Agotado" : !canAfford ? "Sin paga" : "Entrenar"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <Card title="Estado del recluta" iconId="fatigue">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <StatusTile icon={<Coins className="h-5 w-5" />} label="Bolsa" value={soldier.coins} tone="text-gold" />
                  <StatusTile icon={<TrendingUp className="h-5 w-5" />} label="Nivel" value={activeLevel} tone="text-gold-soft" />
                </div>

                <div className="border border-iron bg-stone-950/60 p-3">
                  <div className="mb-2 flex items-center justify-between font-mono text-xs">
                    <span className="uppercase text-text-muted">Fatiga</span>
                    <span className={activeCharacter.fatigue > 75 ? "font-bold text-danger" : "text-text"}>
                      {activeCharacter.fatigue} / 100
                    </span>
                  </div>
                  <div className="stat-bar h-3 rounded-xs">
                    <div
                      className={`h-full transition-all duration-300 ${activeCharacter.fatigue > 75 ? "bg-danger" : "bg-ember"}`}
                      style={{ width: `${activeCharacter.fatigue}%` }}
                    />
                  </div>
                </div>

              </div>
            </Card>
          </aside>
        </section>
      </div>
    </PageTransition>
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
