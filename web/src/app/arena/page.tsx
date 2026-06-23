"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { CharacterPortrait } from "@/components/ui/character-portrait";
import { PageTransition } from "@/components/game/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { VisualOfferGrid } from "@/components/game/visual-offers";
import { ArenaSkeleton, RivalCardSkeletonList } from "@/components/skeletons/arena-skeleton";
import { fightArenaOpponentAction } from "@/lib/actions/combat";
import { prepareActionGateAction } from "@/lib/actions/gate";
import { featuredAssetPaths, getAssetPathById } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";
import type { ArenaOpponent } from "@/lib/types";
import { getEquipmentBonuses } from "@/lib/domain/equipment";

export default function ArenaPage() {
  const { status } = useGameData();
  const soldier = useGameStore((state) => state.soldier);
  const arenaResults = useGameStore((state) => state.arenaResults ?? []);
  const hydrateState = useGameStore((state) => state.hydrateState);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([]);
  const [opponentsLoading, setOpponentsLoading] = useState(true);
  const [activeDuel, setActiveDuel] = useState<{ opponentId: string; seconds: number; resolving: boolean } | null>(null);
  const mountedRef = useRef(true);
  const wins = arenaResults.filter((result) => result.success).length;
  const losses = arenaResults.length - wins;
  const canFight = soldier.fatigue < 100;
  const leaderboardRows = [
    { name: soldier.name, score: wins * 3 + soldier.honor, active: true, portraitAssetId: "diego_retrato_serio" },
    ...opponents.map((opponent) => ({
      name: opponent.name,
      score: opponent.power + opponent.rewards.honor,
      active: false,
      portraitAssetId: opponent.portraitAssetId,
    })),
  ].sort((a, b) => b.score - a.score);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const controller = new AbortController();
    async function loadOpponents() {
      setOpponentsLoading(true);
      try {
        const response = await fetch("/api/arena/opponents", { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { ok?: boolean; opponents?: ArenaOpponent[]; error?: string };
        if (!response.ok || !payload.ok || !payload.opponents) {
          throw new Error(payload.error ?? "No se pudo cargar la arena.");
        }
        setOpponents(payload.opponents);
      } catch (error) {
        if (controller.signal.aborted) return;
        setNotice({ text: error instanceof Error ? error.message : "No se pudo cargar la arena.", ok: false });
      } finally {
        if (!controller.signal.aborted) setOpponentsLoading(false);
      }
    }
    void loadOpponents();
    return () => controller.abort();
  }, [status]);

  const handleFight = async (opponentId: string) => {
    if (activeDuel) return;
    setNotice(null);
    try {
      const gate = await prepareActionGateAction({ kind: "arena", targetId: opponentId });
      setActiveDuel({ opponentId, seconds: Math.ceil(gate.waitMs / 1000), resolving: false });
      await runCountdown(gate.waitMs, (seconds) => {
        if (mountedRef.current) setActiveDuel({ opponentId, seconds, resolving: false });
      });
      if (!mountedRef.current) return;
      setActiveDuel({ opponentId, seconds: 0, resolving: true });
      const result = await fightArenaOpponentAction({ opponentId, gateToken: gate.token });
      if (result.ok && result.data?.state) {
        hydrateState(result.data.state);
      }
      setNotice({ text: result.message, ok: result.ok });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "La arena ha rechazado la orden.", ok: false });
    } finally {
      if (mountedRef.current) setActiveDuel(null);
    }
  };

  if (status !== "ready") {
    return (
      <PageTransition>
        <ArenaSkeleton />
      </PageTransition>
    );
  }

  const equipmentBonuses = getEquipmentBonuses(soldier.equipment);
  const untreatedWounds = soldier.wounds.filter((w) => !w.treated).length;
  const playerPower =
    soldier.stats.sword +
    soldier.stats.pike +
    soldier.stats.vigor +
    soldier.stats.discipline +
    soldier.stats.command +
    Number(equipmentBonuses.sword ?? 0) +
    Number(equipmentBonuses.pike ?? 0) +
    Number(equipmentBonuses.vigor ?? 0) +
    Number(equipmentBonuses.discipline ?? 0) -
    untreatedWounds * 2 -
    Math.floor(soldier.fatigue / 12);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="arena" label="Arena" className="h-9 w-9" />
            <div>
              <h1 className="font-cinzel text-2xl font-extrabold uppercase tracking-wider text-gold md:text-3xl">Arena de la Taberna</h1>
              <p className="text-sm text-text-muted">Duelos locales contra rivales NPC. Sin espera real; solo fatiga, heridas y paga.</p>
            </div>
          </div>
          <Badge variant={canFight ? "gold" : "danger"}>{activeDuel ? "Preparando duelo" : canFight ? "Lista para duelo" : "Agotado"}</Badge>
        </div>

        {notice && (
          <div className={`border px-4 py-2 font-mono text-sm ${notice.ok ? "border-success/40 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger"}`}>
            {notice.text}
          </div>
        )}

        <section className="scene-frame relative min-h-36 overflow-hidden rounded-sm border border-iron bg-stone-950">
          <img
            src={featuredAssetPaths.tavernTable}
            alt="Mesa de taberna preparada para duelos"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/92 via-background/50 to-background/88" />
          <div className="relative z-10 grid gap-2 p-3 md:grid-cols-4">
            <ArenaStat icon="honor" label="Marca" value={`${wins}V / ${losses}D`} />
            <ArenaStat icon="fatigue" label="Fatiga" value={`${soldier.fatigue}/100`} danger={soldier.fatigue >= 80} />
            <ArenaStat icon="coins" label="Doblones" value={`${soldier.coins}`} />
            <ArenaStat icon="wound" label="Heridas" value={`${soldier.wounds.filter((wound) => !wound.treated).length} abiertas`} danger={soldier.wounds.some((wound) => !wound.treated)} />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <Card title="Cartel de Rivales" iconId="arena">
            <div className="grid gap-3">
              {opponentsLoading && <RivalCardSkeletonList count={3} />}
              {!opponentsLoading && opponents.map((opponent) => {
                const isTooTired = soldier.fatigue + opponent.fatigue > 115;
                const duelState = activeDuel?.opponentId === opponent.id ? activeDuel : null;
                return (
                  <ArenaOpponentCard
                    key={opponent.id}
                    opponent={opponent}
                    disabled={!canFight || Boolean(activeDuel)}
                    fatigueWarning={isTooTired}
                    playerPower={playerPower}
                    countdown={duelState?.seconds}
                    resolving={duelState?.resolving ?? false}
                    onFight={() => handleFight(opponent.id)}
                  />
                );
              })}
            </div>
          </Card>

          <div className="space-y-5">
            <Card title="Ranking Local" iconId="rank">
              <div className="space-y-3">
                {leaderboardRows.map((row, index) => (
                  <div
                    key={row.name}
                    className={`flex items-center justify-between gap-3 border px-3 py-2 font-mono text-sm ${
                      row.active
                        ? "border-gold bg-gradient-to-r from-gold/20 via-gold/10 to-transparent shadow-[0_0_12px_rgba(201,162,79,0.15)] text-gold-soft"
                        : "border-iron bg-background/45 text-text-muted"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <CharacterPortrait
                        assetId={row.portraitAssetId}
                        name={row.name}
                        size="xs"
                        rounded="xs"
                        withPlayerBadge={row.active}
                      />
                      <span className="truncate flex items-center gap-1.5">
                        {index === 0 ? (
                          <span className="font-mono text-[10px] font-bold uppercase text-gold">#1</span>
                        ) : (
                          <span className="font-mono text-[10px] text-text-muted">#{index + 1}</span>
                        )}
                        <span className={row.active ? "text-gold font-bold" : ""}>{row.name}</span>
                      </span>
                    </div>
                    <span className={row.active ? "text-gold font-bold" : ""}>{row.score}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Ultimos Duelos" iconId="info">
              {arenaResults.length === 0 ? (
                <div className="border border-dashed border-iron p-5 text-center text-text-muted">
                  <p>Aun no hay sangre en la arena.</p>
                  <Link href="/training" className="mt-3 inline-flex items-center gap-2 text-gold hover:underline">
                    <UiAssetIcon id="training" label="Entrenar" className="h-7 w-7" />
                    Entrenar antes
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {arenaResults.slice(0, 5).map((result) => {
                    const opponent = opponents.find((entry) => entry.id === result.opponentId);
                    return (
                      <div
                        key={result.id}
                        className="parchment-card p-3 shadow-md border-parchment-dark text-stone-900 transition-all hover:scale-[1.01]"
                      >
                        <div className="flex items-start gap-3">
                          <CharacterPortrait
                            assetId={opponent?.portraitAssetId}
                            name={opponent?.name ?? result.opponentId}
                            size="sm"
                            rounded="xs"
                            className="border-stone-400"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-cinzel text-sm font-bold uppercase text-red-950">
                                {opponent?.name ?? result.opponentId}
                              </span>
                              <span
                                className={`rounded-xs border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                                  result.success
                                    ? "border-green-800/30 bg-green-100 text-green-850"
                                    : "border-red-800/30 bg-red-100 text-red-850"
                                }`}
                              >
                                {result.success ? "Victoria" : "Derrota"}
                              </span>
                            </div>
                            <p className="mt-1 font-serif text-xs italic text-stone-850 leading-relaxed">
                              {result.report}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function ArenaOpponentCard({
  opponent,
  disabled,
  fatigueWarning,
  playerPower,
  countdown,
  resolving,
  onFight,
}: {
  opponent: ArenaOpponent;
  disabled: boolean;
  fatigueWarning: boolean;
  playerPower: number;
  countdown?: number;
  resolving: boolean;
  onFight: () => void;
}) {
  const diff = opponent.power - playerPower;
  let threatLabel = "Fácil";
  let threatColor = "text-success border-success/30 bg-success/10";
  let threatIcon: React.ComponentProps<typeof UiAssetIcon>["id"] = "rank";
  if (diff >= 5) {
    threatLabel = "Peligroso";
    threatColor = "text-danger border-danger/30 bg-danger/10";
    threatIcon = "risk";
  } else if (diff >= 3) {
    threatLabel = "Equilibrado";
    threatColor = "text-warning border-warning/30 bg-warning/10";
    threatIcon = "shield";
  }

  const portraitSrc = getAssetPathById(opponent.portraitAssetId);
  const portraitInitials = opponent.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [portraitLoaded, setPortraitLoaded] = useState(false);

  return (
    <section
      className={`game-panel overflow-hidden p-0 transition-colors ${
        disabled
          ? "opacity-90"
          : "hover:border-gold/45 focus-within:border-gold/55"
      }`}
    >
      <div className="relative bg-stone-950">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,162,79,0.08),transparent_55%),linear-gradient(135deg,#1a1612_0%,#0c0a08_100%)]"
          aria-hidden="true"
        />
        <img
          src={featuredAssetPaths.tavernTable}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 scene-image-realism"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/80 to-background/45" />
        <div className="relative z-10 grid gap-3 p-3 md:grid-cols-[220px_minmax(0,1fr)] md:p-4">
          <div className="scene-frame relative h-64 w-full overflow-hidden rounded-xs border border-iron bg-stone-950 md:h-full">
            {!portraitLoaded && <Skeleton className="absolute inset-0" decorative />}
            {portraitSrc ? (
              <Image
                src={portraitSrc}
                alt={opponent.name}
                fill
                sizes="(min-width: 768px) 220px, 100vw"
                className={`object-cover object-top transition-opacity duration-300 ${portraitLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setPortraitLoaded(true)}
                onError={() => setPortraitLoaded(true)}
                priority={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-2xl font-bold text-text-muted">
                {portraitInitials}
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-background/95 via-background/70 to-transparent p-2 pt-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gold-soft/85">{opponent.rank}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-end gap-3">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-cinzel text-xl font-extrabold uppercase tracking-wider text-gold md:text-2xl">
                  {opponent.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${threatColor}`}
                  aria-label={`Amenaza: ${threatLabel}`}
                >
                  <UiAssetIcon id={threatIcon} label="" className="h-3 w-3" />
                  {threatLabel}
                </span>
                {fatigueWarning && (
                  <span
                    className="inline-flex items-center gap-1 rounded-xs border border-warning/45 bg-warning/12 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-warning"
                    title={`Duelo costoso: este rival suma +${opponent.fatigue} de fatiga`}
                  >
                    Cansancio alto
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-muted">{opponent.description}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-gold-soft/80">{opponent.style}</p>
            </div>

            <VisualOfferGrid
              offers={[
                { id: "level", iconId: "rank", label: "Nivel", value: opponent.level, tooltip: "Nivel estimado del rival" },
                { id: "power", iconId: "risk", label: "Poder", value: opponent.power, tooltip: "Poder del rival" },
                { id: "fatigue", iconId: "fatigue", label: "Fatiga", value: `+${opponent.fatigue}`, tooltip: fatigueWarning ? "Fatiga alta tras el duelo" : "Coste de fatiga" },
                { id: "coins", iconId: "coins", label: "Botin", value: `+${opponent.rewards.coins}`, tooltip: "Paga posible" },
              ]}
            />

            <button
              type="button"
              disabled={disabled}
              onClick={onFight}
              className="blood-button inline-flex min-h-12 items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-40"
              aria-busy={resolving || Boolean(countdown)}
            >
              {resolving || countdown ? (
                <span
                  className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
              ) : (
                <UiAssetIcon id="arena" label="" className="h-5 w-5" />
              )}
              {resolving ? "Resolviendo..." : countdown ? `Preparando ${countdown}s` : "Batirse"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function runCountdown(waitMs: number, onTick: (seconds: number) => void) {
  return new Promise<void>((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      const remainingMs = Math.max(0, waitMs - (Date.now() - startedAt));
      onTick(Math.ceil(remainingMs / 1000));
      if (remainingMs <= 0) {
        window.clearInterval(timer);
        resolve();
      }
    };
    const timer = window.setInterval(tick, 250);
    tick();
  });
}

function ArenaStat({ icon, label, value, danger = false }: { icon: React.ComponentProps<typeof UiAssetIcon>["id"]; label: string; value: string; danger?: boolean }) {
  return (
    <div className="icon-stat-tile flex min-h-16 items-center gap-2 p-2">
      <UiAssetIcon id={icon} label={label} className="h-8 w-8" />
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted">{label}</p>
        <p className={`font-cinzel text-xl font-bold ${danger ? "text-danger" : "text-text"}`}>{value}</p>
      </div>
    </div>
  );
}
