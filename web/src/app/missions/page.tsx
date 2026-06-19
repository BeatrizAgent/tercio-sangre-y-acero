"use client";

import React, { Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Compass } from "lucide-react";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { PageTransition } from "@/components/game/page-transition";
import {
  campaignNodeIconPaths,
  featuredAssetPaths,
  getEnemy,
  getEnemySpriteImagePath,
  getMission,
  getMissionSceneImagePath,
} from "@/lib/game-data";
import { regions } from "@/lib/regions";
import type { BossEntry, Region, RegionId } from "@/lib/regions";
import type { MissionDefinition } from "@/lib/types";

function getLocationLabel(type: string): string {
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
      return "Operación";
  }
}

type LocationType = "road" | "city" | "fortress" | "skirmish" | "battle";

function getBossIcon(type: string): string {
  const valid: LocationType[] = ["road", "city", "fortress", "skirmish", "battle"];
  const safe: LocationType = (valid.includes(type as LocationType) ? type : "skirmish") as LocationType;
  return campaignNodeIconPaths[safe];
}

function difficultyTone(difficulty: number): string {
  if (difficulty <= 1) return "border-success/50 bg-success/15 text-success";
  if (difficulty <= 3) return "border-warning/50 bg-warning/15 text-warning";
  return "border-danger/50 bg-danger/15 text-danger";
}

function isPending(boss: BossEntry): boolean {
  return !boss.missionId;
}

const VALID_REGION_IDS = new Set<RegionId>(regions.map((r) => r.id));

function parseRegionId(value: string | null): RegionId | null {
  if (!value) return null;
  return VALID_REGION_IDS.has(value as RegionId) ? (value as RegionId) : null;
}

export default function MissionsPage() {
  return (
    <Suspense fallback={<MissionsFallback />}>
      <MissionsContent />
    </Suspense>
  );
}

function MissionsFallback() {
  return (
    <div className="py-12 text-center font-cinzel text-xl text-gold animate-pulse">
      Cargando mapa de campaña...
    </div>
  );
}

function MissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRegion = parseRegionId(searchParams.get("region"));
  const urlBossId = searchParams.get("boss");

  const region: Region | null = urlRegion
    ? regions.find((entry) => entry.id === urlRegion) ?? null
    : null;
  const openBossId = region && urlBossId && region.bosses.some((boss) => boss.id === urlBossId)
    ? urlBossId
    : null;

  const openMission: MissionDefinition | undefined = region && openBossId
    ? getMission(region.bosses.find((boss) => boss.id === openBossId)?.missionId ?? "")
    : undefined;
  const openEnemy = openMission ? getEnemy(openMission.enemyId) : undefined;
  const openEnemySprite = openMission ? getEnemySpriteImagePath(openMission.enemyId) : undefined;

  const writeParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      router.replace(query ? `/missions?${query}` : "/missions", { scroll: false });
    },
    [router, searchParams],
  );

  const setRegion = useCallback(
    (next: RegionId | null) => {
      writeParams((params) => {
        if (next) {
          params.set("region", next);
        } else {
          params.delete("region");
        }
        params.delete("boss");
      });
    },
    [writeParams],
  );

  const toggleBoss = useCallback(
    (id: string | null) => {
      writeParams((params) => {
        if (id && params.get("boss") !== id) {
          params.set("boss", id);
        } else {
          params.delete("boss");
        }
      });
    },
    [writeParams],
  );

  return (
    <PageTransition>
      <div className="space-y-5">
        <header className="flex items-center justify-between gap-3 border-b border-iron pb-3">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="missions" label="Campaña" className="h-12 w-12" />
            <div>
              <h1 className="font-cinzel text-2xl font-extrabold tracking-wider text-gold md:text-3xl">
                MAPA DE CAMPAÑA
              </h1>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Cinco frentes · Veinte generales enemigos
              </p>
            </div>
          </div>
          <Compass className="h-8 w-8 text-gold/70" />
        </header>

        {!region && <WorldMap onSelect={setRegion} />}
        {region && (
          <RegionPanel
            region={region}
            openBossId={openBossId}
            onToggleBoss={toggleBoss}
            onBack={() => setRegion(null)}
            openMission={openMission}
            openEnemyName={openEnemy?.name}
            openEnemySprite={openEnemySprite}
          />
        )}
      </div>
    </PageTransition>
  );
}

function WorldMap({ onSelect }: { onSelect: (id: RegionId) => void }) {
  return (
    <section className="game-panel rounded-xs border border-iron bg-stone-950/80 p-2 shadow-inner">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xs bg-stone-950">
        <img
          src={featuredAssetPaths.campaignMap}
          alt="Mapa de los frentes de campaña del Tercio"
          className="pointer-events-none h-full w-full select-none object-cover opacity-70"
        />
        <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_center,_rgba(0,0,0,0)_50%,_rgba(0,0,0,0.55)_100%)] mix-blend-multiply" />

        {regions.map((region) => {
          const readyCount = region.bosses.filter((boss) => !isPending(boss)).length;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onSelect(region.id)}
              aria-label={`Frente de ${region.name}. ${readyCount} de ${region.bosses.length} operaciones listas.`}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition focus:outline-hidden group-hover:z-50 group-focus-visible:z-50"
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
            >
              <span className="pointer-events-none absolute -inset-3 rounded-full border border-gold-soft/40 opacity-0 transition group-hover:opacity-90" />
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-iron/70 bg-stone-950/65 shadow-xl transition group-hover:scale-105 group-hover:border-gold/70 md:h-16 md:w-16">
                <img
                  src={campaignNodeIconPaths.skirmish}
                  alt=""
                  aria-hidden="true"
                  className="h-12 w-12 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] md:h-14 md:w-14"
                />
                <span
                  className={`absolute -bottom-1.5 -right-1.5 rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                    readyCount > 0
                      ? "border-gold/60 bg-stone-950/95 text-gold"
                      : "border-iron bg-stone-950/95 text-text-muted"
                  }`}
                >
                  {readyCount}/{region.bosses.length}
                </span>
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-56 -translate-x-1/2 border border-gold/35 bg-stone-950/98 p-2.5 text-left shadow-2xl group-hover:block group-focus-visible:block">
                <span className="block font-cinzel text-sm font-bold uppercase text-gold">{region.name}</span>
                <span className="mt-1 block font-mono text-[10px] leading-snug text-text-muted">
                  {region.description}
                </span>
                <span className="mt-1.5 block border-t border-iron/40 pt-1.5 font-mono text-[9px] uppercase tracking-wider text-gold-soft">
                  Operaciones: <span className="text-gold">{readyCount}/{region.bosses.length}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 px-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
        Elige un frente desde el mapa o desde el menú lateral.
      </p>
    </section>
  );
}

function RegionPanel({
  region,
  openBossId,
  onToggleBoss,
  onBack,
  openMission,
  openEnemyName,
  openEnemySprite,
}: {
  region: Region;
  openBossId: string | null;
  onToggleBoss: (id: string | null) => void;
  onBack: () => void;
  openMission: MissionDefinition | undefined;
  openEnemyName: string | undefined;
  openEnemySprite: string | undefined;
}) {
  const readyCount = region.bosses.filter((boss) => !isPending(boss)).length;
  const totalRewards = region.bosses
    .filter((boss) => boss.missionId)
    .reduce(
      (acc, boss) => {
        acc.coins += boss.rewards.coins;
        acc.xp += boss.rewards.xp;
        acc.honor += boss.rewards.honor;
        return acc;
      },
      { coins: 0, xp: 0, honor: 0 },
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-iron/50 pb-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al mapa
          </button>
          <h2 className="font-cinzel text-2xl font-extrabold uppercase text-gold md:text-3xl">{region.name}</h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">{region.description}</p>
        </div>
        <div className="flex gap-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          <span className="rounded-xs border border-iron px-2 py-1">
            Operaciones: <span className="text-gold">{readyCount}/{region.bosses.length}</span>
          </span>
          {readyCount > 0 && (
            <span className="rounded-xs border border-iron px-2 py-1">
              Botín total: <span className="text-gold">+{totalRewards.coins} doblones</span>
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {region.bosses.map((boss) => {
          const isOpen = openBossId === boss.id;
          const pending = isPending(boss);

          return (
            <li
              key={boss.id}
              className={`game-panel rounded-xs border bg-stone-950/80 transition-colors ${
                pending
                  ? "border-iron/40 opacity-60"
                  : isOpen
                    ? "border-gold/60"
                    : "border-iron hover:border-gold/30"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleBoss(isOpen ? null : boss.id)}
                disabled={pending}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center gap-3 p-3 text-left focus:outline-hidden disabled:cursor-not-allowed"
              >
                <span className="asset-icon-frame inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xs border border-iron bg-stone-950/80 p-1">
                  <img
                    src={getBossIcon(boss.type)}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h3 className="font-cinzel text-base font-bold uppercase leading-tight text-gold">
                      {boss.title}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                      {getLocationLabel(boss.type)}
                    </span>
                  </div>
                  {pending ? (
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-warning">
                      Operación pendiente · sin datos
                    </p>
                  ) : (
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      Jefe regional · listo para desplegar
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {pending ? (
                    <span className="rounded-xs border border-warning/50 bg-warning/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-warning">
                      PENDIENTE
                    </span>
                  ) : (
                    <>
                      <span
                        className={`rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-bold ${difficultyTone(boss.difficulty)}`}
                        title="Dificultad"
                      >
                        N{boss.difficulty}
                      </span>
                      <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-ember">
                        <UiAssetIcon id="fatigue" label="Fatiga" className="h-4 w-4" />+{boss.fatigue}
                      </span>
                      <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-danger">
                        <UiAssetIcon id="wound" label="Herida" className="h-4 w-4" />
                        {boss.woundChance}%
                      </span>
                    </>
                  )}
                </div>
              </button>

              {isOpen && openMission && !pending && (
                <div className="border-t border-iron/50 p-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                    <div className="scene-frame relative h-28 overflow-hidden rounded-xs border border-iron bg-stone-950">
                      <img
                        src={getMissionSceneImagePath(openMission.id)}
                        alt={openMission.title}
                        className="h-full w-full object-cover opacity-90"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
                      {openEnemySprite && (
                        <span className="asset-icon-frame absolute bottom-1.5 right-1.5 inline-flex h-10 w-10 items-center justify-center rounded-xs border border-iron bg-stone-950/85 p-0.5">
                          <img src={openEnemySprite} alt={openEnemyName ?? "Enemigo"} className="h-full w-full object-contain" />
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 font-sans">
                      {openEnemyName && (
                        <div className="flex items-center gap-2">
                          <UiAssetIcon id="risk" label="Enemigo" className="h-5 w-5" />
                          <span className="font-cinzel text-sm font-bold uppercase text-text">
                            {openEnemyName}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <StatTile icon="fatigue" label="Fatiga" value={`+${openMission.fatigue}`} tone="text-ember" />
                        <StatTile icon="wound" label="Herida" value={`${openMission.woundChance}%`} tone="text-danger" />
                        <StatTile icon="coins" label="Paga" value={`+${openMission.rewards.coins}`} tone="text-gold" />
                        <StatTile icon="xp" label="Fama" value={`+${openMission.rewards.xp}`} tone="text-text" />
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/missions/${openMission.id}`}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xs border border-blood-bright bg-blood py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-text shadow-md transition-colors hover:bg-blood-bright hover:text-white"
                  >
                    <UiAssetIcon id="confirm" label="" className="h-5 w-5" />
                    <span>Desplegar</span>
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentProps<typeof UiAssetIcon>["id"];
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="icon-stat-tile flex items-center gap-2 rounded-xs px-2 py-1.5">
      <UiAssetIcon id={icon} label={label} className="h-6 w-6" />
      <div className="min-w-0 leading-tight">
        <div className="font-mono text-[8.5px] uppercase tracking-wider text-muted">{label}</div>
        <div className={`font-cinzel text-xs font-bold ${tone}`}>{value}</div>
      </div>
    </div>
  );
}
