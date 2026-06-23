"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Coins, TrendingUp } from "lucide-react";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { GladiatusBar } from "@/components/ui/gladiatus-bar";
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

  const handleTrain = (stat: StatId) => {
    runTrain({ stat, characterId: activeCharacter.id });
  };

  const isFatigued = activeCharacter.fatigue >= 100;
  const activeLevel = getCharacterLevel(activeCharacter.stats);

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="page-header">
          <div>
            <p className="page-header__eyebrow">Maestro de armas del Tercio</p>
            <h1 className="page-header__title">Entrenamiento</h1>
            <p className="page-header__subtitle">Pagas y fatiga. Sin paga no hay progreso.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="gold">{soldier.coins} doblones</Badge>
            <Badge variant={isFatigued ? "danger" : "default"}>{activeCharacter.fatigue}/100 fatiga</Badge>
          </div>
        </header>

        {message && (
          <div
            role="status"
            className={`notice ${message.isError ? "notice--err" : "notice--ok"}`}
          >
            {message.text}
          </div>
        )}

        <section className="game-panel rounded-xs border border-iron bg-stone-950/70 p-3">
          <div className="panel-header">
            <span className="panel-header__title">Recluta activo</span>
            <span className="panel-header__meta">{activeCharacter.role}</span>
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
                  className={`flex min-h-20 items-center gap-2 rounded-xs border-2 p-2 text-left transition-all relative overflow-hidden ${
                    isActive
                      ? "border-gold bg-gradient-to-b from-panel-raised to-panel shadow-[0_0_10px_rgba(201,162,79,0.25)] text-gold-soft"
                      : "border-iron/80 bg-gradient-to-b from-stone-900/80 to-stone-950/90 text-text-muted hover:border-gold/45 hover:text-gold-soft"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-gold rotate-45 translate-x-1 -translate-y-1" />
                  )}
                  <span className="h-14 w-12 shrink-0 overflow-hidden rounded-xs border border-iron/60 bg-black/35">
                    {portrait && <img src={portrait} alt="" className="h-full w-full object-cover object-top" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-cinzel text-xs font-bold uppercase tracking-wide">
                      {character.name}
                    </span>
                    <span className="block font-mono text-[9px] uppercase text-text-muted mt-0.5">
                      Nv {level}
                    </span>
                    <span className="block font-mono text-[9px] uppercase text-ember mt-0.5">
                      {character.fatigue}/100 fatiga
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="game-panel overflow-hidden rounded-xs border border-iron bg-gradient-to-b from-stone-900/85 to-stone-950/90 shadow-inner">
            <div className="relative min-h-40 border-b border-iron bg-stone-950">
              <Image
                src={featuredAssetPaths.training}
                alt=""
                fill
                fetchPriority="high"
                sizes="100vw"
                className="object-cover opacity-45 saturate-75"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/72 to-stone-950/20" />
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

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-muted">
                        <span>Progreso</span>
                        <span>{currentVal}/25</span>
                      </div>
                      <GladiatusBar
                        type="xp"
                        value={currentVal}
                        max={25}
                        className="h-3.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px] lg:flex lg:flex-col lg:gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted lg:hidden">Coste:</span>
                        <div className="flex items-center gap-1">
                          <UiAssetIcon id="coins" label="Doblones" className="h-3.5 w-3.5" />
                          <span className={soldier.coins >= costCoins ? "text-gold font-bold" : "text-danger"}>
                            {costCoins}
                          </span>
                        </div>
                        {costXp > 0 && (
                          <div className="flex items-center gap-1 ml-1.5">
                            <UiAssetIcon id="xp" label="XP" className="h-3.5 w-3.5" />
                            <span className={soldier.xp >= costXp ? "text-success font-bold" : "text-danger"}>
                              {costXp} XP
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted lg:hidden">Fatiga:</span>
                        <div className="flex items-center gap-1">
                          <UiAssetIcon id="fatigue" label="Fatiga" className="h-3.5 w-3.5" />
                          <span className="text-ember font-bold">+{option.fatigue}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTrain(option.stat)}
                      disabled={disabled}
                      className="blood-button min-h-10 w-full text-xs font-bold uppercase tracking-wider"
                    >
                      {isFatigued ? "Agotado" : !canAfford ? "Sin paga" : "Entrenar"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <Card title="Estado del recluta" iconId="fatigue">
              <div className="space-y-3">
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
        </div>
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
