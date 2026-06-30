"use client";

import React, { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { PageTransition } from "@/components/game/page-transition";
import { NpcOfferFrame } from "@/components/game/visual-offers";
import { MissionsSkeleton } from "@/components/skeletons/missions-skeleton";
import { prepareActionGateAction } from "@/lib/actions/gate";
import { resolveStoryChoiceAction } from "@/lib/actions/story";
import { useGameStore } from "@/lib/game-store";
import {
  campaignNodeIconPaths,
  featuredAssetPaths,
  getAssetPathById,
  getEnemy,
  getEnemySpriteImagePath,
  getItem,
  getMission,
  getMissionSceneImagePath,
  prologueStoryArc,
} from "@/lib/game-data";
import { useGameData } from "@/lib/hooks/use-game-data";
import { regions } from "@/lib/regions";
import type { BossEntry, Region, RegionId } from "@/lib/regions";
import type { GameState, MissionDefinition, StoryChapter, StoryChoice } from "@/lib/types";

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
    <PageTransition>
      <MissionsSkeleton />
    </PageTransition>
  );
}

function MissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useGameData();
  const { soldier, storyProgress, hydrateState } = useGameStore();
  const urlRegion = parseRegionId(searchParams.get("region"));
  const urlBossId = searchParams.get("boss");
  const mode = searchParams.get("mode") === "story" ? "story" : "campaign";

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

  const setMode = useCallback(
    (next: "campaign" | "story") => {
      writeParams((params) => {
        if (next === "story") {
          params.set("mode", "story");
        } else {
          params.delete("mode");
        }
        params.delete("region");
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

  if (status !== "ready") {
    return <MissionsSkeleton />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="page-header">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="missions" label="Campaña" className="h-10 w-10" />
            <div>
              <p className="page-header__eyebrow">Cartografía militar</p>
              <h1 className="page-header__title">{mode === "story" ? "Campaña: historia" : "Mapa de campaña"}</h1>
              <p className="page-header__subtitle">
                {mode === "story" ? "Prólogo jugable de Diego de Arce." : "Cinco frentes · Veinte generales enemigos."}
              </p>
            </div>
          </div>
          <Compass className="hidden h-8 w-8 text-gold/70 sm:block" aria-hidden="true" />
        </header>

        {mode === "story" && (
          <StoryPanel
            state={{ soldier, storyProgress }}
            onHydrate={hydrateState}
            onOpenCampaign={() => setMode("campaign")}
          />
        )}
        {mode === "campaign" && !region && <WorldMap onSelect={setRegion} />}
        {mode === "campaign" && region && (
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

function StoryPanel({
  state,
  onHydrate,
  onOpenCampaign,
}: {
  state: Pick<GameState, "soldier" | "storyProgress">;
  onHydrate: (state: GameState) => void;
  onOpenCampaign: () => void;
}) {
  const [busyChoice, setBusyChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{
    chapterTitle: string;
    choiceLabel: string;
    resultText: string;
    message: string;
    reportId?: string;
  } | null>(null);
  const progress = state.storyProgress ?? {
    arcId: prologueStoryArc.id,
    currentChapterId: prologueStoryArc.chapters[0]?.id ?? "",
    completedChapterIds: [],
    choices: {},
  };
  const complete = prologueStoryArc.chapters.every((chapter) => progress.completedChapterIds.includes(chapter.id));
  const activeChapter =
    prologueStoryArc.chapters.find((chapter) => chapter.id === progress.currentChapterId) ??
    prologueStoryArc.chapters[0];
  const chapterGroups = chunkStoryChapters(prologueStoryArc.chapters, 5);

  const resolveChoice = async (chapter: StoryChapter, choice: StoryChoice) => {
    if (busyChoice) return;
    setBusyChoice(choice.id);
    setError(null);
    try {
      const gate = await prepareActionGateAction({ kind: "story", targetId: `${chapter.id}:${choice.id}` });
      const result = await resolveStoryChoiceAction({ chapterId: chapter.id, choiceId: choice.id, gateToken: gate.token });
      if (result.ok && result.data?.state) {
        setOutcome({
          chapterTitle: chapter.title,
          choiceLabel: choice.label,
          resultText: choice.resultText,
          message: result.message,
          reportId: result.data.reportId,
        });
        onHydrate(result.data.state);
      } else {
        setError(result.message);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo resolver la historia.");
    } finally {
      setBusyChoice(null);
    }
  };

  const scenePath = getAssetPathById(activeChapter.sceneAssetId) ?? featuredAssetPaths.campaignMap;

  return (
    <section className="space-y-3">
      <div className="page-header">
        <div>
          <p className="page-header__eyebrow">Modo historia</p>
          <h2 className="page-header__title">{prologueStoryArc.title}</h2>
          <p className="page-header__subtitle">{prologueStoryArc.subtitle}</p>
        </div>
        <span className="rounded-xs border border-iron px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {progress.completedChapterIds.length}/{prologueStoryArc.chapters.length}
        </span>
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {chapterGroups.map((group, index) => {
          const active = group.some((chapter) => chapter.id === activeChapter.id);
          const done = group.every((chapter) => progress.completedChapterIds.includes(chapter.id));
          const firstChapter = group[0];
          const lastChapter = group[group.length - 1];
          const startChapter = prologueStoryArc.chapters.indexOf(firstChapter) + 1;
          const endChapter = prologueStoryArc.chapters.indexOf(lastChapter) + 1;
          const locked = !done && !active;
          const rangeLabel = startChapter === endChapter ? `Cap. ${startChapter}` : `Cap. ${startChapter}-${endChapter}`;

          return (
            <li
              key={firstChapter.id}
              className={`flex min-h-16 min-w-0 flex-col justify-between rounded-xs border px-2 py-2 font-mono text-[10px] uppercase leading-tight ${
                done
                  ? "border-success/50 bg-success/10 text-success"
                  : active
                    ? "border-gold/60 bg-gold/10 text-gold"
                    : "border-iron/50 bg-stone-950/70 text-text-muted"
              }`}
            >
              <span className="block text-[9px] text-text-muted">Acto {index + 1}</span>
              <span className="block truncate">{active ? activeChapter.title : firstChapter.title}</span>
              <span className="block text-[8px] text-text-muted">{rangeLabel}</span>
              {locked && <span className="mt-1 block text-[8px] text-iron">Bloqueado</span>}
            </li>
          );
        })}
      </ol>

      {outcome && (
        <div className="rounded-xs border border-gold/40 bg-gold/10 p-3 shadow-inner">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gold">{outcome.message}</p>
              <h3 className="mt-1 font-cinzel text-base font-bold uppercase text-gold-soft">{outcome.chapterTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                <span className="font-semibold text-text">{outcome.choiceLabel}.</span> {outcome.resultText}
              </p>
            </div>
            {outcome.reportId && (
              <Link
                href={`/reports/${outcome.reportId}`}
                className="inline-flex shrink-0 items-center justify-center rounded-xs border border-gold/50 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-gold transition hover:bg-gold/10"
              >
                Ver reporte
              </Link>
            )}
          </div>
        </div>
      )}

      {complete ? (
        <StoryCompletePanel progress={progress} onOpenCampaign={onOpenCampaign} />
      ) : (
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="scene-frame relative h-[360px] overflow-hidden rounded-xs border border-iron bg-stone-950">
          <img
            src={scenePath}
            alt={activeChapter.mature ? "Escena velada" : activeChapter.title}
            className={`h-full w-full object-cover ${activeChapter.presentation === "blurred" ? "scale-105 blur-md opacity-70" : ""}`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            {activeChapter.mature && (
              <span className="mb-2 inline-flex rounded-xs border border-warning/50 bg-warning/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-warning">
                Escena velada
              </span>
            )}
            <h3 className="font-cinzel text-2xl font-bold uppercase tracking-wider text-gold">{activeChapter.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">{activeChapter.text}</p>
          </div>
        </div>

        <Card title="Decisión" iconId="order">
          <div className="space-y-2">
            {activeChapter.choices.map((choice) => {
              const blocked = storyChoiceBlockReason(state, choice);
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={Boolean(blocked) || Boolean(busyChoice)}
                  onClick={() => void resolveChoice(activeChapter, choice)}
                  className={`w-full rounded-xs border p-3 text-left transition ${
                    blocked
                      ? "cursor-not-allowed border-iron/30 bg-stone-950/80 opacity-60"
                      : "border-iron bg-stone-900/60 hover:border-gold/50"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <UiAssetIcon id={blocked ? "risk" : "confirm"} label="" className="h-8 w-8 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-cinzel text-sm font-bold text-gold-soft">{choice.label}</span>
                      <span className="mt-1 flex flex-wrap gap-2 font-mono text-[10px] uppercase text-text-muted">
                        {choice.effects.xp !== undefined && <span>XP {signed(choice.effects.xp)}</span>}
                        {choice.effects.coins !== undefined && <span>Doblones {signed(choice.effects.coins)}</span>}
                        {choice.effects.honor !== undefined && <span>Honor {signed(choice.effects.honor)}</span>}
                        {choice.effects.fatigue !== undefined && <span>Fatiga {signed(choice.effects.fatigue)}</span>}
                        {choice.effects.items?.map((item) => (
                          <span key={item.itemId}>+{item.quantity} {getItem(item.itemId)?.name ?? item.itemId}</span>
                        ))}
                        {choice.effects.wound && <span>Herida</span>}
                      </span>
                      {blocked && <span className="mt-1 block font-mono text-[9px] uppercase text-danger">{blocked}</span>}
                      {busyChoice === choice.id && <span className="mt-1 block font-mono text-[9px] uppercase text-gold">Resolviendo...</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {error && (
            <div className="mt-3 border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-danger">
              {error}
            </div>
          )}
        </Card>
      </div>
      )}
    </section>
  );
}

function StoryCompletePanel({
  progress,
  onOpenCampaign,
}: {
  progress: NonNullable<GameState["storyProgress"]>;
  onOpenCampaign: () => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
      <div className="scene-frame relative min-h-[360px] overflow-hidden rounded-xs border border-gold/50 bg-stone-950">
        <img
          src={featuredAssetPaths.campaignMap}
          alt="Mapa de campaña desbloqueado"
          className="h-full min-h-[360px] w-full object-cover opacity-65"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/45 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="mb-2 inline-flex rounded-xs border border-success/50 bg-success/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-success">
            Prólogo cerrado
          </span>
          <h3 className="font-cinzel text-2xl font-bold uppercase tracking-wider text-gold">Diego ya no vuelve igual</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
            La aldea queda atrás. La deuda, el barro y la primera sangre ya pesan en la mochila. Desde aquí, la campaña
            abierta decide si Diego gana honra o solo sobrevive a otra paga atrasada.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onOpenCampaign} className="blood-button inline-flex items-center gap-2 px-4 py-2 text-xs">
              <UiAssetIcon id="missions" label="" className="h-5 w-5" />
              Abrir campaña
            </button>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center rounded-xs border border-iron px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-text-muted transition hover:border-gold/60 hover:text-gold"
            >
              Ver reportes
            </Link>
          </div>
        </div>
      </div>

      <Card title="Camino elegido" iconId="order">
        <ol className="space-y-2">
          {prologueStoryArc.chapters.map((chapter, index) => {
            const choice = chapter.choices.find((entry) => entry.id === progress.choices[chapter.id]);
            return (
              <li key={chapter.id} className="rounded-xs border border-iron/60 bg-stone-950/70 p-2">
                <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Cap. {index + 1}</p>
                <p className="mt-0.5 font-cinzel text-sm font-bold uppercase text-gold-soft">{chapter.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{choice?.label ?? "Sin decisión registrada"}</p>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}

function storyChoiceBlockReason(state: Pick<GameState, "soldier">, choice: StoryChoice) {
  if (choice.requirements?.coins && state.soldier.coins < choice.requirements.coins) {
    return `Faltan ${choice.requirements.coins - state.soldier.coins} doblones`;
  }
  for (const item of choice.requirements?.items ?? []) {
    const owned = state.soldier.inventory.find((entry) => entry.itemId === item.itemId)?.quantity ?? 0;
    if (owned < item.quantity) return `Falta ${item.quantity - owned} ${getItem(item.itemId)?.name ?? item.itemId}`;
  }
  return null;
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function chunkStoryChapters<T>(items: T[], groups: number): T[][] {
  return Array.from({ length: groups }, (_, groupIndex) => {
    const start = Math.floor((groupIndex * items.length) / groups);
    const end = Math.floor(((groupIndex + 1) * items.length) / groups);
    return items.slice(start, end);
  }).filter((group) => group.length > 0);
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_50%,_rgba(0,0,0,0.55)_100%)] mix-blend-multiply" />

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
                  className="h-12 w-12 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] md:h-14 md:h-14"
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
    <div className="space-y-3">
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al mapa
          </button>
          <h2 className="page-header__title">{region.name}</h2>
          <p className="page-header__subtitle">{region.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          <span className="rounded-xs border border-iron px-2 py-1">
            Operaciones: <span className="text-gold">{readyCount}/{region.bosses.length}</span>
          </span>
          {readyCount > 0 && (
            <span className="rounded-xs border border-iron px-2 py-1">
              Botin total: <span className="text-gold">+{totalRewards.coins} doblones</span>
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {region.bosses.map((boss) => {
          const isOpen = openBossId === boss.id;
          const pending = isPending(boss);
          const bossPortrait = getAssetPathById(boss.portraitAssetId);

          return (
            <li
              key={boss.id}
              className={`deferred-section--boss-row game-panel rounded-xs border bg-stone-950/80 transition-colors ${
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
                <span className="asset-icon-frame inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-iron bg-stone-950/80 p-0.5">
                  {bossPortrait ? (
                    <img
                      src={bossPortrait}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={getBossIcon(boss.type)}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-1"
                    />
                  )}
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
                  <NpcOfferFrame
                    model={{
                      id: openMission.id,
                      title: openEnemyName ?? openMission.title,
                      subtitle: getLocationLabel(boss.type),
                      portraitSrc: openEnemySprite ?? bossPortrait ?? getBossIcon(boss.type),
                      sceneSrc: getMissionSceneImagePath(openMission.id),
                      offers: [
                        { id: "fatigue", iconId: "fatigue", label: "Fatiga", value: `+${openMission.fatigue}`, tooltip: "Fatiga de despliegue" },
                        { id: "wound", iconId: "wound", label: "Herida", value: `${openMission.woundChance}%`, tooltip: "Riesgo de herida" },
                        { id: "coins", iconId: "coins", label: "Paga", value: `+${openMission.rewards.coins}`, tooltip: "Paga posible" },
                        { id: "xp", iconId: "xp", label: "Fama", value: `+${openMission.rewards.xp}`, tooltip: "Experiencia posible" },
                      ],
                    }}
                  >
                    <Link
                      href={`/missions/${openMission.id}`}
                      className="blood-button flex w-full cursor-pointer items-center justify-center gap-2 py-2.5 text-xs"
                    >
                      <UiAssetIcon id="confirm" label="" className="h-5 w-5" />
                      <span>Desplegar</span>
                    </Link>
                  </NpcOfferFrame>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
