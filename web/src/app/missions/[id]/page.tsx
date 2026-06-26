"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { PageTransition } from "@/components/game/page-transition";
import { MissionCanvasResolver } from "@/components/game/MissionCanvasResolver";
import { resolveActiveEventChoiceAction, startMissionAction } from "@/lib/actions/combat";
import { prepareActionGateAction } from "@/lib/actions/gate";
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
import { MissionDetailSkeleton } from "@/components/skeletons/mission-detail-skeleton";
import { useGameData } from "@/lib/hooks/use-game-data";
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

function campaignIconFor(locationType: string) {
  return campaignNodeIconPaths[locationType as keyof typeof campaignNodeIconPaths] ?? campaignNodeIconPaths.skirmish;
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
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; side: "left" | "right" } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const enterTimer = React.useRef<number | null>(null);
  const leaveTimer = React.useRef<number | null>(null);

  const show = hovered || pinned;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const popW = popoverRef.current?.offsetWidth ?? 288;
    const popH = popoverRef.current?.offsetHeight ?? 320;
    const margin = 8;
    const edge = 8;
    const fitsLeft = rect.left - popW - margin >= edge;
    const side: "left" | "right" = fitsLeft ? "left" : "right";
    let left =
      side === "left"
        ? rect.left - popW - margin
        : rect.right + margin;
    const maxLeft = window.innerWidth - popW - edge;
    left = Math.max(edge, Math.min(left, Math.max(edge, maxLeft)));
    let top = rect.top + rect.height / 2 - popH / 2;
    const maxTop = window.innerHeight - popH - edge;
    top = Math.max(edge, Math.min(top, Math.max(edge, maxTop)));
    setPopoverPos({ top, left, side });
  }, []);

  const handleEnter = () => {
    if (leaveTimer.current) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    enterTimer.current = window.setTimeout(() => {
      setHovered(true);
      requestAnimationFrame(updatePosition);
    }, 180);
  };

  const handleLeave = () => {
    if (enterTimer.current) {
      window.clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    leaveTimer.current = window.setTimeout(() => {
      setHovered((h) => (pinned ? h : false));
    }, 140);
  };

  useLayoutEffect(() => {
    if (!show) return;
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, updatePosition]);

  useEffect(() => {
    if (!pinned) return;
    const handleOutsidePointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setPinned(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(false);
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [pinned]);

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

  const arrowOnRight = popoverPos?.side === "left";
  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(50% - 6px)",
    width: 12,
    height: 12,
    transform: "rotate(45deg)",
    background: "#f3ebd4",
    borderColor: "#997e56",
    borderTopWidth: 1,
    borderRightWidth: 1,
    pointerEvents: "none",
  };
  if (arrowOnRight) {
    arrowStyle.right = -6;
  } else {
    arrowStyle.left = -6;
  }

  const popover = show ? (
    <div
      ref={popoverRef}
      role="tooltip"
      data-enemy-popover
      style={{
        position: "fixed",
        top: popoverPos?.top ?? -10000,
        left: popoverPos?.left ?? -10000,
        zIndex: 9999,
        visibility: popoverPos ? "visible" : "hidden",
        width: "18rem",
      }}
      className="parchment-card p-4 text-stone-800 shadow-2xl animate-in fade-in slide-in-from-right-2 duration-150"
    >
      <span aria-hidden="true" style={arrowStyle} />
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
  ) : null;

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        ref={triggerRef}
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
      {popover && typeof document !== "undefined" && createPortal(popover, document.body)}
    </div>
  );
}

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useGameData();
  const { soldier, activeEvent, pendingMissionId, activeMission, hydrateState } = useGameStore();
  // useSyncExternalStore replaces the `useState(false) + useEffect(setTrue)`
  // pattern, avoiding the cascading-render lint warning. The server
  // snapshot is false; the client snapshot is true (no subscription is
  // needed because the value never changes after hydration).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [resolving, setResolving] = useState(false);
  const [gateToken, setGateToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [localRegenTimer, setLocalRegenTimer] = useState<string>("");

  useEffect(() => {
    const currentPoints = soldier.actionPoints !== undefined ? soldier.actionPoints : 12;
    if (currentPoints >= 12 || !soldier.lastRegenAt) {
      setLocalRegenTimer("");
      return;
    }

    const tick = () => {
      const s = useGameStore.getState().soldier;
      const pts = s.actionPoints !== undefined ? s.actionPoints : 12;
      if (pts >= 12 || !s.lastRegenAt) {
        setLocalRegenTimer("");
        return;
      }

      const nextRegenTime = new Date(s.lastRegenAt).getTime() + 30 * 60 * 1000;
      const now = Date.now();
      const remainingMs = nextRegenTime - now;

      if (remainingMs <= 0) {
        useGameStore.getState().hydrateState({ ...useGameStore.getState() });
        return;
      }

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      setLocalRegenTimer(`${minutes}:${String(seconds).padStart(2, "0")}`);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [soldier.actionPoints, soldier.lastRegenAt]);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!activeMission || activeMission.status !== "active") return;
    const timer = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeMission]);

  if (!mounted || status !== "ready") {
    return (
      <PageTransition>
        <MissionDetailSkeleton />
      </PageTransition>
    );
  }

  if (activeEvent) {
    const eventAsset = activeEvent.assetId ? getAsset(activeEvent.assetId) : undefined;
    const eventImagePath = eventAsset ? getAssetPublicPath(eventAsset) : undefined;
    const shouldBlurEvent = activeEvent.presentation === "blurred";
    const eventImageFit = eventAsset?.transparent ? "object-contain p-3" : "object-cover";

    return (
      <PageTransition>
        <div className="relative mx-auto max-w-3xl space-y-5">
          {(resolving || countdown !== null) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4">
              <div className="game-panel flex items-center gap-4 border-2 border-iron p-5">
                <UiAssetIcon id="missions" label="Resolviendo" className={`h-12 w-12 ${resolving ? "animate-spin" : ""}`} />
                <div>
                  <h2 className="font-cinzel text-lg font-bold uppercase tracking-widest text-gold">
                    {countdown !== null ? `Preparando ${countdown}s` : "Resolviendo"}
                  </h2>
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
                      onClick={() => void handleEventChoice(choice.id)}
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

            {actionError && (
              <div className="border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-danger">
                {actionError}
              </div>
            )}
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
  const noActionPoints = (soldier.actionPoints !== undefined ? soldier.actionPoints : 12) <= 0;
  const lootTable = mission ? lootTableDefinitions.find((tbl) => tbl.id === mission.lootTableId) : undefined;

  const relevantStatLabel: Record<string, string> = {
    pike: "Pica",
    sword: "Espada",
    arquebus: "Arcabuz",
    discipline: "Disciplina",
  };

  const startGateCountdown = async (waitMs: number) => {
    const startedAt = Date.now();
    setCountdown(Math.ceil(waitMs / 1000));
    await new Promise<void>((resolve) => {
      const tick = () => {
        const remainingMs = Math.max(0, waitMs - (Date.now() - startedAt));
        if (mountedRef.current) setCountdown(Math.ceil(remainingMs / 1000));
        if (remainingMs <= 0) {
          window.clearInterval(timer);
          resolve();
        }
      };
      const timer = window.setInterval(tick, 250);
      tick();
    });
    if (mountedRef.current) setCountdown(null);
  };

  const handleMissionStart = async (missionId: string) => {
    if (resolving || countdown !== null) return;
    setActionError(null);
    try {
      const gate = await prepareActionGateAction({ kind: "mission", targetId: missionId });
      setGateToken(gate.token);
      await startGateCountdown(gate.waitMs);
      if (!mountedRef.current) return;
      const result = await startMissionAction({ missionId, gateToken: gate.token });
      if (result.ok && result.data?.state) {
        hydrateState(result.data.state);
        setGateToken(null);
        if (result.data.eventTriggered) {
          return;
        }
        if (result.data.reportId) {
          router.push(`/reports/${result.data.reportId}`);
          return;
        }
      }
      setActionError(result.message);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo preparar la orden.");
      setCountdown(null);
      setResolving(false);
    }
  };

  const resolveMissionAfterCanvas = async (missionId: string) => {
    try {
      const result = await startMissionAction({ missionId, gateToken: gateToken ?? undefined });
      if (result.ok && result.data?.state) {
        hydrateState(result.data.state);
        if (result.data.eventTriggered) {
          setResolving(false);
          setGateToken(null);
          return;
        }
        if (result.data.reportId) {
          router.push(`/reports/${result.data.reportId}`);
          return;
        }
      }
      setActionError(result.message);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo resolver la misión.");
    } finally {
      if (mountedRef.current) {
        setResolving(false);
        setGateToken(null);
      }
    }
  };

  const handleEventChoice = async (choiceId: string) => {
    if (!pendingMissionId || resolving || countdown !== null) return;
    setActionError(null);
    try {
      const gate = await prepareActionGateAction({ kind: "event", targetId: `${pendingMissionId}:${choiceId}` });
      await startGateCountdown(gate.waitMs);
      if (!mountedRef.current) return;
      setResolving(true);
      playDrumSound();
      const result = await resolveActiveEventChoiceAction({ choiceId, gateToken: gate.token });
      if (result.ok && result.data?.state) {
        hydrateState(result.data.state);
        if (result.data.reportId) {
          router.push(`/reports/${result.data.reportId}`);
          return;
        }
      }
      setActionError(result.message);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo resolver el evento.");
    } finally {
      if (mountedRef.current) setResolving(false);
    }
  };

  const handleStart = () => {
    void handleMissionStart(mission.id);
  };

  const activeForThisMission = activeMission?.status === "active" && activeMission.missionId === mission.id;
  const activeElsewhere = activeMission?.status === "active" && activeMission.missionId !== mission.id;
  const remainingMs = activeMission?.status === "active"
    ? Math.max(0, new Date(activeMission.completesAt).getTime() - clockTick)
    : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const remainingLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <PageTransition>
        <div className="relative space-y-4">
        {countdown !== null && !resolving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4">
            <div className="game-panel flex items-center gap-4 border-2 border-iron p-5">
              <UiAssetIcon id="missions" label="Preparando" className="h-12 w-12" />
              <div>
                <h2 className="font-cinzel text-lg font-bold uppercase tracking-widest text-gold">Preparando {countdown}s</h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-blood-bright">Cruz de Borgoña · Tercio VIII</p>
              </div>
            </div>
          </div>
        )}
        {resolving && (
          <MissionCanvasResolver
            mission={mission}
            soldier={soldier}
            onComplete={() => void resolveMissionAfterCanvas(mission.id)}
          />
        )}

        <header className="page-header">
          <div className="flex min-w-0 items-center gap-3">
            <img src={campaignIconFor(mission.locationType)} alt="" className="h-10 w-10 object-contain" />
            <div className="min-w-0">
              <p className="page-header__eyebrow">{locationLabel(mission.locationType)}</p>
              <h1 className="page-header__title truncate">{mission.title}</h1>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="rounded-xs border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-soft">
                  Riesgo {mission.difficulty}
                </span>
                <span className="rounded-xs border border-iron/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {mission.locationType}
                </span>
              </div>
            </div>
          </div>
          <UiAssetIcon id="order" label="Orden" className="hidden h-10 w-10 sm:block" />
        </header>

        <div className="grid gap-4 md:grid-cols-[1.55fr_1fr]">
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

                <div className="grid gap-2 sm:grid-cols-4">
                  <StatTile iconId="shield" value={totalPower} tone={totalPower >= targetPower ? "text-success" : "text-danger"} tooltip="Tu poder efectivo" />
                  <StatTile iconId="risk" value={enemyPower} tone="text-danger" tooltip="Poder del enemigo" />
                  <StatTile iconId="confirm" value={`${chance}%`} tone={chance >= 80 ? "text-success" : chance >= 50 ? "text-warning" : "text-danger"} tooltip="Probabilidad de exito" />
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
                    <StatTile iconId="honor" value={`+${mission.rewards.honor}`} tone="text-gold-soft" tooltip="Honor" />
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

                <div className="rounded-xs border border-iron/40 bg-stone-950/40 p-2.5 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase">
                    <span className="text-text-muted">Puntos de Acción:</span>
                    <span className="font-bold text-gold">{soldier.actionPoints !== undefined ? soldier.actionPoints : 12} / 12</span>
                  </div>
                  {soldier.actionPoints !== undefined && soldier.actionPoints < 12 && (
                    <div className="font-mono text-[9px] text-right text-text-muted uppercase">
                      Próximo punto en: <span className="text-gold-soft">{localRegenTimer || "--:--"}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStart}
                  disabled={isAgotado || resolving || countdown !== null || noActionPoints}
                  className={`blood-button flex w-full items-center justify-center gap-2 py-3 text-sm ${
                    isAgotado || resolving || countdown !== null || noActionPoints ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  <UiAssetIcon id="confirm" label="" className="h-5 w-5" />
                  {countdown !== null
                    ? `Preparando ${countdown}s`
                    : resolving
                      ? "Resolviendo..."
                      : isAgotado
                        ? "Agotado"
                        : noActionPoints
                          ? "Sin Puntos de Acción"
                          : "Iniciar mision"}
                </button>

                {actionError && (
                  <div className="border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-danger">
                    {actionError}
                  </div>
                )}

                {isAgotado && (
                  <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase text-danger">
                    <UiAssetIcon id="fatigue" label="Fatiga" className="h-5 w-5" />
                    <span>Descanso requerido</span>
                  </div>
                )}
              </div>
            </Card>

            {lootTable && (
              <Card title="Botin" iconId="inventory">
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
