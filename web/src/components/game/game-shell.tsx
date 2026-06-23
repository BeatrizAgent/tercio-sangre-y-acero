"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { QuickAction, ResourceChip } from "@/components/ui/resource-chip";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { useGameStore } from "@/lib/game-store";
import { getRankName, getAssetPathById, featuredAssetPaths, missionDefinitions, rankDefinitions } from "@/lib/game-data";
import { playPageSound } from "@/lib/sounds";
import { GladiatusBar } from "@/components/ui/gladiatus-bar";

const overviewLink = { href: "/soldier", label: "Vision general", icon: "info" } as const;

const dispatchLinks = [
  { href: "/mailbox", label: "Buzon", icon: "mailbox" },
  { href: "/reports", label: "Reportes", icon: "battleReports" },
  { href: "/news", label: "Novedades", icon: "news" },
  { href: "/packages", label: "Paquetes", icon: "packages" },
] as const;

export function GameShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const { soldier, reports, arenaResults } = useGameStore();

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const ACTION_MAX = 15;
  const warVictories = reports.filter((report) => {
    if (!report.success) return false;
    const mission = missionDefinitions.find((entry) => entry.id === report.missionId);
    return mission?.locationType === "battle" || mission?.locationType === "fortress";
  }).length;
  const missionsCompleted = reports.filter((report) => {
    const mission = missionDefinitions.find((entry) => entry.id === report.missionId);
    return mission?.locationType === "road" || mission?.locationType === "city" || mission?.locationType === "skirmish";
  }).length;
  const actionsRemaining = Math.max(0, ACTION_MAX - reports.length);
  const missionsRemaining = Math.max(0, ACTION_MAX - missionsCompleted);
  const pvpRemaining = Math.max(0, ACTION_MAX - arenaResults.length);
  const warRemaining = Math.max(0, ACTION_MAX - warVictories);

  const currentRankIdx = rankDefinitions.findIndex((r) => r.id === soldier.rank);
  const currentRank = currentRankIdx >= 0 ? rankDefinitions[currentRankIdx] : null;
  const nextRank = currentRankIdx >= 0 && currentRankIdx < rankDefinitions.length - 1
    ? rankDefinitions[currentRankIdx + 1]
    : null;
  
  const xpMin = currentRank ? currentRank.minXp : 0;
  const xpMax = nextRank ? nextRank.minXp : xpMin + 100;
  const xpValue = soldier.xp;
  
  const hpValue = Math.max(0, 100 - soldier.fatigue);
  const hpMax = 100;

  const playerPortraitSrc =
    getAssetPathById(soldier.portraitAssetId) ?? featuredAssetPaths.diegoDeArcePortrait;

  return (
    <div className="min-h-screen bg-stone-950 text-text font-sans selection:bg-gold/30 selection:text-gold-soft overflow-x-hidden overflow-y-auto py-4 px-2 md:py-8">
      <div className="game-shell-frame mx-auto max-w-[1080px] w-full min-w-0 overflow-hidden flex flex-col bg-background border border-iron shadow-2xl rounded-sm relative">
        <div className="hidden xl:block absolute top-0 -left-10 w-8 h-full bg-[url('/assets/gpt-bank/ui/icons/marco_panel_vertical_negro.png')] bg-repeat-y opacity-25 pointer-events-none border-r border-iron/20" />
        <div className="hidden xl:block absolute top-0 -right-10 w-8 h-full bg-[url('/assets/gpt-bank/ui/icons/marco_panel_vertical_negro.png')] bg-repeat-y opacity-25 pointer-events-none border-l border-iron/20" />

        {mounted && (
          <header className="top-command-bar min-w-0 max-w-full overflow-hidden border-b border-iron px-3 py-2 flex flex-col gap-2">
            <div className="flex flex-col md:flex-row gap-2 items-stretch">
              {/* Logo Plate */}
              <div className="gladiatus-titleplate flex items-center justify-center shrink-0 w-full md:w-[200px] p-2 relative overflow-hidden">
                <Link href="/city" className="w-full h-full flex items-center justify-center">
                  <Image
                    src="/assets/brand/tercio-logo.png"
                    alt="Tercio: Sangre y Acero"
                    width={2048}
                    height={875}
                    fetchPriority="high"
                    loading="eager"
                    className="tercio-brand-logo max-h-[64px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]"
                  />
                </Link>
              </div>

              {/* Medallion & Bars */}
              <div className="gladiatus-character-card flex flex-1 items-center gap-3 p-2 min-w-0">
                {/* Medallion */}
                <div className="relative h-12 w-12 shrink-0 rounded-full border-2 border-gold bg-black shadow-[0_0_6px_rgba(201,162,79,0.3)] overflow-hidden">
                  <Image
                    src={playerPortraitSrc}
                    alt={soldier.name}
                    width={100}
                    height={100}
                    fetchPriority="high"
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                </div>
                {/* Name & Bars */}
                <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-cinzel text-sm font-bold text-text truncate">{soldier.name}</span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-soft truncate">{getRankName(soldier.rank)}</span>
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <GladiatusBar
                      type="hp"
                      value={hpValue}
                      max={hpMax}
                      label="Vida"
                      showPercentage
                      className="h-3.5"
                    />
                    <GladiatusBar
                      type="xp"
                      value={xpValue - xpMin}
                      max={xpMax - xpMin}
                      label="XP"
                      showPercentage
                      className="h-3.5"
                    />
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="gladiatus-resource-rail flex items-stretch justify-between gap-1.5 p-2 shrink-0 w-full md:w-[420px]">
                <ResourceChip
                  icon="honor"
                  label="Honor"
                  value={soldier.honor}
                  tone="text-gold-soft"
                  compact
                  className="flex-1"
                />
                <ResourceChip
                  icon="missions"
                  label="Fama"
                  value={soldier.reputation >= 0 ? `+${soldier.reputation}` : soldier.reputation}
                  tone={soldier.reputation >= 0 ? "text-success" : "text-danger"}
                  compact
                  className="flex-1"
                />
                <ResourceChip
                  icon="coins"
                  label="Oro"
                  value={soldier.coins}
                  tone="text-gold"
                  compact
                  className="flex-1"
                />
                <ResourceChip
                  icon="fatigue"
                  label="Fatiga"
                  value={`${soldier.fatigue}/100`}
                  tone={soldier.fatigue > 75 ? "text-danger" : "text-ember"}
                  compact
                  className="flex-1"
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="topbar-panel p-1.5 shadow-inner flex flex-col md:flex-row items-center gap-2">
              {/* Visión General */}
              <Link
                href={overviewLink.href}
                title={overviewLink.label}
                onClick={() => playPageSound()}
                className="flex shrink-0 items-center gap-1.5 px-2.5 py-1 bg-gold/10 hover:bg-gold/20 border border-gold/45 rounded-xs transition-all group w-full md:w-auto justify-center"
              >
                <UiAssetIcon id={overviewLink.icon} label={overviewLink.label} className="h-4 w-4" />
                <span className="font-sans font-bold uppercase tracking-wider text-gold group-hover:text-gold-soft truncate text-[10px]">
                  {overviewLink.label}
                </span>
              </Link>

              <div className="hidden md:block h-5 w-px bg-iron/60" aria-hidden="true" />

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 flex-1 min-w-0 w-full">
                <QuickAction
                  href="/training"
                  icon="training"
                  label="Acciones"
                  value={actionsRemaining}
                  max={ACTION_MAX}
                  tone={actionsRemaining > 0 ? "text-gold" : "text-muted"}
                  onNavigate={() => playPageSound()}
                  className="!py-0.5 !px-1.5 flex-1 md:flex-initial"
                />
                <QuickAction
                  href="/missions"
                  icon="missions"
                  label="Misiones"
                  value={missionsRemaining}
                  max={ACTION_MAX}
                  tone={missionsRemaining > 0 ? "text-gold-soft" : "text-muted"}
                  onNavigate={() => playPageSound()}
                  className="!py-0.5 !px-1.5 flex-1 md:flex-initial"
                />
                <QuickAction
                  href="/arena"
                  icon="arena"
                  label="PvP"
                  value={pvpRemaining}
                  max={ACTION_MAX}
                  tone="text-ember"
                  onNavigate={() => playPageSound()}
                  className="!py-0.5 !px-1.5 flex-1 md:flex-initial"
                />
                <QuickAction
                  href="/missions"
                  icon="shield"
                  label="Guerra"
                  value={warRemaining}
                  max={ACTION_MAX}
                  tone="text-danger"
                  onNavigate={() => playPageSound()}
                  className="!py-0.5 !px-1.5 flex-1 md:flex-initial"
                />
              </div>

              <div className="hidden md:block h-5 w-px bg-iron/60" aria-hidden="true" />

              {/* Dispatch Links */}
              <div className="flex items-center gap-1 w-full md:w-auto justify-center">
                {dispatchLinks.map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    onClick={() => playPageSound()}
                    className="flex items-center gap-1 px-1.5 py-1 bg-panel/40 hover:bg-panel-raised border border-iron/60 hover:border-gold/50 rounded-xs transition-all flex-1 md:flex-initial group justify-center"
                  >
                    <UiAssetIcon id={icon} label={label} className="h-4 w-4" />
                    <span className="topbar-shortcut-label font-sans font-bold uppercase tracking-wider text-text-muted group-hover:text-gold truncate text-[9px] md:text-[10px]">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {(soldier.unpaidWages > 0 || soldier.banMissionsLeft > 0) && (
              <div className="flex flex-row items-center gap-2">
                {soldier.unpaidWages > 0 && (
                  <div className="flex-1 border border-ember/40 bg-ember/10 px-2 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-ember animate-pulse">
                    Alerta · {soldier.unpaidWages} doblones atrasados
                  </div>
                )}
                {soldier.banMissionsLeft > 0 && (
                  <div className="flex-1 border border-danger/45 bg-danger/10 px-2 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-blood-bright animate-pulse">
                    Destierro · {soldier.banMissionsLeft} turnos
                  </div>
                )}
              </div>
            )}
          </header>
        )}

        <div className="flex flex-col md:flex-row gap-4 p-4 items-start">
          <Suspense
            fallback={
              <aside className="w-full md:w-60 bg-panel border border-iron flex flex-col justify-between shrink-0 rounded-xs p-4 shadow-md">
                <div className="text-center font-cinzel text-xs text-gold animate-pulse">
                  Cargando campamento...
                </div>
              </aside>
            }
          >
            <SidebarNav />
          </Suspense>

          <main className="flex-1 w-full min-w-0">
            {!mounted ? (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center space-y-4">
                  <div className="w-10 h-10 border-2 border-t-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-cinzel text-sm text-gold tracking-widest uppercase animate-pulse">
                    Estableciendo campamento...
                  </p>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
