"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { PageTransition } from "@/components/game/page-transition";
import { MissionCanvasResolver } from "@/components/game/MissionCanvasResolver";
import { rarityStyle } from "@/lib/item-format";
import { useGameStore } from "@/lib/game-store";
import {
  campaignNodeIconPaths,
  getAsset,
  getAssetPublicPath,
  getEnemy,
  getEnemySpriteImagePath,
  getEquipmentBonuses,
  getItem,
  getMission,
  getMissionSceneImagePath,
  lootTableDefinitions,
  getItemImagePath,
} from "@/lib/game-data";
import { playDrumSound } from "@/lib/sounds";
import type { MissionDefinition } from "@/lib/types";

type IconId = React.ComponentProps<typeof UiAssetIcon>["id"];

function locationLabel(type: MissionDefinition["locationType"]) {
  switch (type) {
    case "city":
      return "Ciudad";
    case "fortress":
      return "Baluarte";
    case "road":
      return "Camino";
    case "skirmish":
      return "Escaramuza";
    case "battle":
      return "Batalla";
    default:
      return "Orden";
  }
}

function StatTile({
  iconId,
  value,
  tone = "text-text",
  tooltip,
}: {
  iconId: IconId;
  value: string | number;
  tone?: string;
  tooltip: string;
}) {
  return (
    <Tooltip type="simple" content={tooltip} fill>
      <div className="icon-stat-tile flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xs border border-iron bg-stone-950/75 px-1.5 py-1 cursor-help">
        <UiAssetIcon id={iconId} label={tooltip} className="h-5 w-5 shrink-0" />
        <div className={`truncate font-cinzel text-lg font-bold leading-none ${tone}`}>{value}</div>
      </div>
    </Tooltip>
  );
}

function DropTile({ itemId, weight }: { itemId: string; weight?: number }) {
  const item = getItem(itemId);
  if (!item) return null;
  const style = rarityStyle(item.rarity);
  const w = weight ?? 0;
  return (
    <Tooltip type="item" itemId={itemId} fill>
      <div className={`group relative flex flex-col items-center justify-center p-1.5 bg-stone-950/80 border ${style.ring} hover:border-gold/60 rounded-xs transition-all cursor-help h-full min-h-[72px]`}>
        <span className="absolute top-0.5 right-0.5 px-1 bg-stone-950/90 text-gold-soft font-mono text-[8px] font-bold rounded-xs border border-iron/30 z-10">
          {w}%
        </span>
        <span className="h-9 w-9 inline-flex items-center justify-center overflow-hidden mb-1 mt-1">
          <img src={getItemImagePath(itemId)} alt={item.name} className="h-8 w-8 object-contain group-hover:scale-110 transition-transform duration-200" />
        </span>
      </div>
    </Tooltip>
  );
}

function MiniIcon({ iconId, label }: { iconId: IconId; label: string }) {
  return <UiAssetIcon id={iconId} label={label} className="h-10 w-10 rounded-xs border border-iron bg-stone-950/75 p-1" />;
}

function EnemyHoverCard({
  enemy,
  enemySprite,
  mission,
  targetPower,
  totalPower,
  chance,
}: {
  enemy: ReturnType<typeof getEnemy>;
  enemySprite: string | undefined;
  mission: MissionDefinition;
  targetPower: number;
  totalPower: number;
  chance: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const enterTimer = React.useRef<number | null>(null);
  const leaveTimer = React.useRef<number | null>(null);

  const show = hovered || pinned;

  const handleEnter = () => {
    if (leaveTimer.current) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    enterTimer.current = window.setTimeout(() => setHovered(true), 180);
  };

  const handleLeave = () => {
    if (enterTimer.current) {
      window.clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    leaveTimer.current = window.setTimeout(() => setHovered(false), 140);
  };

  React.useEffect(() => () => {
    if (enterTimer.current) window.clearTimeout(enterTimer.current);
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
  }, []);

  if (!enemy) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xs border border-iron bg-stone-950/75 p-2">
        <UiAssetIcon id="risk" label="Enemigo" className="h-16 w-16" />
        <span className="max-w-20 truncate font-mono text-[9px] uppercase text-danger">Enemigo</span>
      </div>
    );
  }

  const threat = enemy.power >= 4 ? "Alta" : enemy.power >= 2 ? "Media" : "Baja";
  const threatTone = enemy.power >= 4 ? "text-danger" : enemy.power >= 2 ? "text-warning" : "text-success";

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        aria-expanded={show}
        aria-label={`Ver ${enemy.name}`}
        className={`group flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xs border bg-stone-950/75 p-2 transition disabled:cursor-not-allowed ${show ? "border-danger/60" : "border-iron hover:border-danger/40"}`}
      >
        {enemySprite ? (
          <img src={enemySprite} alt={enemy.name} className="h-20 w-20 object-contain transition group-hover:scale-105" />
        ) : (
          <UiAssetIcon id="risk" label={enemy.name} className="h-16 w-16" />
        )}
        <span className={`max-w-20 truncate font-mono text-[9px] uppercase ${show ? "text-gold-soft" : "text-danger"}`}>
          {enemy.name}
        </span>
      </button>

      {show && (
        <div
          className="parchment-card absolute right-full top-1/2 z-30 mr-2 w-72 -translate-y-1/2 p-4 text-stone-800 shadow-2xl animate-in fade-in slide-in-from-right-2 duration-150"
          role="tooltip"
        >
          <span
            aria-hidden="true"
            className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-t border-r border-parchment-dark bg-parchment"
          />
          <header className="mb-2 border-b border-stone-700/40 pb-1.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-blood">Enemigo</p>
            <h3 className="font-cinzel text-lg font-bold uppercase leading-tight text-stone-900">{enemy.name}</h3>
            <p className={`font-mono text-[10px] font-bold uppercase ${threatTone === "text-danger" ? "text-blood" : threatTone === "text-warning" ? "text-amber-700" : "text-emerald-800"}`}>
              Amenaza {threat}
            </p>
          </header>

          <p className="mb-3 font-serif text-xs italic leading-relaxed text-stone-700">&quot;{enemy.description}&quot;</p>

          <div className="mb-2 flex items-center gap-2 rounded-xs border border-stone-700/30 bg-stone-100/60 p-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-600">Poder</span>
            <span className="font-cinzel text-lg font-bold text-blood">{enemy.power}</span>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-stone-600">vs</span>
            <span className="font-cinzel text-lg font-bold text-stone-900">{totalPower}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-600">tuyo</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] uppercase">
            <div className="rounded-xs border border-stone-700/30 bg-stone-100/60 px-1.5 py-1 text-center">
              <div className="text-stone-600">Herida</div>
              <div className="font-cinzel text-sm font-bold text-blood">{mission.woundChance}%</div>
            </div>
            <div className="rounded-xs border border-stone-700/30 bg-stone-100/60 px-1.5 py-1 text-center">
              <div className="text-stone-600">Fatiga</div>
              <div className="font-cinzel text-sm font-bold text-amber-700">+{mission.fatigue}</div>
            </div>
            <div className="rounded-xs border border-stone-700/30 bg-stone-100/60 px-1.5 py-1 text-center">
              <div className="text-stone-600">Éxito</div>
              <div className={`font-cinzel text-sm font-bold ${chance >= 80 ? "text-emerald-800" : chance >= 50 ? "text-amber-700" : "text-blood"}`}>
                {chance}%
              </div>
            </div>
          </div>

          <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-widest text-stone-500">
            Click para {pinned ? "soltar" : "fijar"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { soldier, startMission, activeEvent, resolveActiveEventChoice } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="py-12 text-center font-cinzel text-gold animate-pulse">Cargando misión...</div>;
  }

  if (activeEvent) {
    const eventAsset = activeEvent.assetId ? getAsset(activeEvent.assetId) : undefined;
    const eventImagePath = eventAsset ? getAssetPublicPath(eventAsset) : undefined;
    const shouldBlurEvent = activeEvent.presentation === "blurred";
    const eventImageFit = eventAsset?.transparent ? "object-contain p-3" : "object-cover";

    return (
      <PageTransition>
        <div className="relative mx-auto max-w-3xl space-y-5">
          {resolving && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4">
              <div className="game-panel flex items-center gap-4 border-2 border-iron p-5">
                <UiAssetIcon id="missions" label="Resolviendo" className="h-12 w-12 animate-spin" />
                <div>
                  <h2 className="font-cinzel text-lg font-bold uppercase tracking-widest text-gold">Resolviendo</h2>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-blood-bright">Cruz de Borgoña · Tercio VIII</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 border-b border-iron pb-3">
            <UiAssetIcon id="order" label="Evento" className="h-11 w-11" />
            <div>
              <h1 className="font-cinzel text-2xl font-bold uppercase tracking-wider text-gold">{activeEvent.title}</h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Evento de campaña</p>
            </div>
          </div>

          <Card title="Decisión" iconId="order">
            <div className="space-y-4">
              {eventImagePath && (
                <div className="relative h-64 overflow-hidden rounded-xs border border-iron bg-stone-950">
                  <img
                    src={eventImagePath}
                    alt={activeEvent.mature ? "Escena velada" : activeEvent.title}
                    className={`h-full w-full ${eventImageFit} ${shouldBlurEvent ? "scale-105 blur-md opacity-70" : ""}`}
                  />
                </div>
              )}

              <div className="grid gap-3">
                {activeEvent.choices.map((choice) => {
                  const canSelect = !choice.requirements.coins || soldier.coins >= choice.requirements.coins;
                  return (
                    <button
                      key={choice.id}
                      disabled={!canSelect}
                      onClick={() => {
                        setResolving(true);
                        playDrumSound();
                        window.setTimeout(() => {
                          const res = resolveActiveEventChoice(choice.id);
                          if (res.ok && res.data?.reportId) router.push(`/reports/${res.data.reportId}`);
                          else setResolving(false);
                        }, 700);
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xs border p-3 text-left transition ${
                        canSelect ? "border-iron bg-stone-900/60 hover:border-gold/40" : "border-iron/30 bg-stone-950/80 opacity-60"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <UiAssetIcon id={canSelect ? "confirm" : "risk"} label="" className="h-9 w-9" />
                        <span className="min-w-0">
                          <span className="block truncate font-cinzel text-sm font-bold text-gold-soft">{choice.label}</span>
                          <span className="mt-1 flex flex-wrap gap-2 font-mono text-[10px] uppercase text-text-muted">
                            {choice.effects.coins !== undefined && <span>Doblones {choice.effects.coins > 0 ? "+" : ""}{choice.effects.coins}</span>}
                            {choice.effects.honor !== undefined && <span>Honor {choice.effects.honor > 0 ? "+" : ""}{choice.effects.honor}</span>}
                            {choice.effects.fatigue !== undefined && <span>Fatiga {choice.effects.fatigue > 0 ? "+" : ""}{choice.effects.fatigue}</span>}
                            {choice.effects.wound && <span>Herida</span>}
                            {choice.effects.items?.map((it) => (
                              <span key={it.itemId}>+{it.quantity} {getItem(it.itemId)?.name || it.itemId}</span>
                            ))}
                          </span>
                        </span>
                      </span>
                      <UiAssetIcon id="order" label="" className="h-7 w-7" />
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const id = params.id as string;
  const mission = getMission(id);
  if (!mission) {
    return <div className="py-12 text-center font-mono text-xs text-danger">Misión no encontrada.</div>;
  }

  const equipmentBonuses = getEquipmentBonuses(soldier.equipment);
  const relevantStat = mission.type.includes("escort") || mission.type.includes("skirmish")
    ? "arquebus"
    : mission.type.includes("duel")
      ? "sword"
      : mission.type.includes("watch")
        ? "discipline"
        : "pike";

  const basePower =
    soldier.stats[relevantStat] +
    soldier.stats.discipline +
    soldier.stats.vigor +
    Number(equipmentBonuses[relevantStat] ?? 0) +
    Number(equipmentBonuses.discipline ?? 0) +
    Number(equipmentBonuses.vigor ?? 0);
  const woundPenalty = soldier.wounds.filter((w) => !w.treated).length * 2;
  const fatiguePenalty = Math.floor(soldier.fatigue / 10);
  const totalPower = basePower - woundPenalty - fatiguePenalty;
  const enemy = getEnemy(mission.enemyId);
  const enemyPower = enemy?.power ?? 0;
  const enemySprite = getEnemySpriteImagePath(mission.enemyId);
  const targetPower = mission.difficulty * 4 + enemyPower;
  const requiredRoll = targetPower - totalPower;
  const chance = requiredRoll <= 1 ? 100 : requiredRoll > 5 ? 0 : ((6 - requiredRoll) / 5) * 100;
  const isAgotado = soldier.fatigue >= 100;
  const lootTable = mission ? lootTableDefinitions.find((tbl) => tbl.id === mission.lootTableId) : undefined;

  const relevantStatLabel: Record<string, string> = {
    pike: "Pica",
    sword: "Espada",
    arquebus: "Arcabuz",
    discipline: "Disciplina",
  };

  const handleStart = () => {
    setResolving(true);
  };

  return (
    <PageTransition>
      <div className="relative space-y-5">
        {resolving && (
          <MissionCanvasResolver
            mission={mission}
            soldier={soldier}
            onComplete={() => {
              const res = startMission(mission.id);
              if (res.ok) {
                if (res.data?.eventTriggered) setResolving(false);
                else if (res.data?.reportId) router.push(`/reports/${res.data.reportId}`);
              } else {
                setResolving(false);
              }
            }}
          />
        )}

        <div className="flex items-center justify-between gap-3 border-b border-iron pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src={campaignNodeIconPaths[mission.locationType]} alt="" className="h-12 w-12 object-contain" />
            <div className="min-w-0">
              <h1 className="truncate font-cinzel text-2xl font-bold uppercase tracking-wider text-gold">{mission.title}</h1>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-xs border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-soft">
                  {locationLabel(mission.locationType)}
                </span>
                <span className="rounded-xs border border-danger/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-danger">
                  Riesgo {mission.difficulty}
                </span>
              </div>
            </div>
          </div>
          <UiAssetIcon id="order" label="Orden" className="h-11 w-11" />
        </div>

        <div className="grid gap-5 md:grid-cols-[1.55fr_1fr]">
          <div className="space-y-4">
            <div className="scene-frame relative h-[360px] overflow-hidden rounded-xs border border-iron bg-stone-950">
              <img
                src={getMissionSceneImagePath(mission.id)}
                alt={mission.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                <StatTile iconId="shield" value={relevantStatLabel[relevantStat]} tone="text-gold-soft" tooltip="Habilidad relevante" />
                <StatTile iconId="fatigue" value={`+${mission.fatigue}`} tone="text-ember" tooltip="Fatiga de despliegue" />
                <StatTile iconId="wound" value={`${mission.woundChance}%`} tone="text-danger" tooltip="Riesgo de herida" />
                <StatTile iconId="risk" value={targetPower} tone="text-danger" tooltip="Poder objetivo" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <StatTile iconId="shield" value={totalPower} tone={totalPower >= targetPower ? "text-success" : "text-danger"} tooltip="Tu poder efectivo" />
              <StatTile iconId="risk" value={enemyPower} tone="text-danger" tooltip="Poder del enemigo" />
              <StatTile iconId="confirm" value={`${chance}%`} tone={chance >= 80 ? "text-success" : chance >= 50 ? "text-warning" : "text-danger"} tooltip="Probabilidad de éxito" />
              <StatTile iconId="mud" value={`-${woundPenalty + fatiguePenalty}`} tone="text-danger" tooltip="Malus por heridas y fatiga" />
            </div>
          </div>

          <div className="space-y-4">
            <Card title="Objetivo" iconId="risk">
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_88px] gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <StatTile iconId="coins" value={`+${mission.rewards.coins}`} tone="text-gold" tooltip="Doblones" />
                    <StatTile iconId="xp" value={`+${mission.rewards.xp}`} tooltip="Experiencia" />
                    <StatTile iconId="honor" value={`+${mission.rewards.honor}`} tone="text-amber" tooltip="Honor" />
                    <StatTile iconId="missions" value={locationLabel(mission.locationType)} tone="text-gold-soft" tooltip="Tipo" />
                  </div>

                  <EnemyHoverCard
                    enemy={enemy}
                    enemySprite={enemySprite}
                    mission={mission}
                    targetPower={targetPower}
                    totalPower={totalPower}
                    chance={chance}
                  />
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <MiniIcon iconId="order" label="Orden" />
                  <MiniIcon iconId="mud" label="Barro" />
                  <MiniIcon iconId="wound" label="Herida" />
                  <MiniIcon iconId="coins" label="Paga" />
                  <MiniIcon iconId="honor" label="Honor" />
                </div>

                <button
                  onClick={handleStart}
                  disabled={isAgotado || resolving}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xs border py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all ${
                    isAgotado || resolving
                      ? "border-iron bg-stone-900 text-muted cursor-not-allowed"
                      : "border-blood-bright bg-blood text-text hover:bg-blood-bright hover:text-white"
                  }`}
                >
                  <UiAssetIcon id="confirm" label="" className="h-6 w-6" />
                  {resolving ? "Resolviendo..." : isAgotado ? "Agotado" : "Iniciar misión"}
                </button>

                {isAgotado && (
                  <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase text-danger">
                    <UiAssetIcon id="fatigue" label="Fatiga" className="h-5 w-5" />
                    <span>Descanso requerido</span>
                  </div>
                )}
              </div>
            </Card>

            {lootTable && (
              <Card title="Botín" iconId="inventory">
                <div className="grid grid-cols-4 gap-2">
                  {lootTable.drops.map((drop) => (
                    <DropTile key={drop.itemId} itemId={drop.itemId} weight={drop.weight} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
