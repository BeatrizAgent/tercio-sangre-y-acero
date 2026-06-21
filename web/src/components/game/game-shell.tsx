"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";
import { QuickAction, ResourceChip } from "@/components/ui/resource-chip";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { useGameStore } from "@/lib/game-store";
import { getRankName, featuredAssetPaths, missionDefinitions } from "@/lib/game-data";
import { playPageSound } from "@/lib/sounds";

const overviewLink = { href: "/soldier", label: "Vision general", icon: "info" } as const;

const dispatchLinks = [
  { href: "/mailbox", label: "Buzon", icon: "mailbox" },
  { href: "/reports", label: "Reportes", icon: "battleReports" },
  { href: "/news", label: "Novedades", icon: "news" },
  { href: "/packages", label: "Paquetes", icon: "packages" },
] as const;

export function GameShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const { soldier, reports, arenaResults } = useGameStore();

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

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

  return (
    <div className="min-h-screen bg-stone-950 text-text font-sans selection:bg-gold/30 selection:text-gold-soft overflow-x-hidden overflow-y-auto py-4 px-2 md:py-8">
      <div className="mx-auto max-w-[1080px] w-full min-w-0 overflow-hidden flex flex-col bg-background border border-iron shadow-2xl rounded-sm relative">
        <div className="hidden xl:block absolute top-0 -left-10 w-8 h-full bg-[url('/assets/gpt-bank/ui/icons/marco_panel_vertical_negro.png')] bg-repeat-y opacity-25 pointer-events-none border-r border-iron/20" />
        <div className="hidden xl:block absolute top-0 -right-10 w-8 h-full bg-[url('/assets/gpt-bank/ui/icons/marco_panel_vertical_negro.png')] bg-repeat-y opacity-25 pointer-events-none border-l border-iron/20" />

        {mounted && (
          <header className="top-command-bar min-w-0 max-w-full overflow-hidden border-b border-iron px-3 py-2 flex flex-col gap-2">
            <div
              className="gladiatus-masthead"
              style={{ gridTemplateColumns: "minmax(220px, 1.1fr) minmax(280px, 1.3fr) minmax(280px, 1.2fr)", gap: "8px" }}
            >
              <div
                className="gladiatus-titleplate"
                style={{ minHeight: "unset", padding: "2px 6px", justifyContent: "center" }}
              >
                <Image
                  src="/assets/brand/tercio-logo.png"
                  alt="Tercio: Sangre y Acero"
                  width={2048}
                  height={875}
                  priority
                  className="h-full w-full max-h-[84px] object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
                />
              </div>

              <div
                className="gladiatus-character-card flex-row items-stretch gap-1.5 min-w-0"
                style={{ padding: "4px 6px" }}
              >
                <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 min-w-[56px]">
                  <div className="relative h-10 w-10 overflow-hidden rounded-sm border border-gold/30 bg-black/50 shadow-inner">
                    <Image
                      src={featuredAssetPaths.diegoDeArcePortrait}
                      alt={soldier.name}
                      width={1086}
                      height={1448}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="text-center leading-tight">
                    <div className="truncate font-cinzel text-[10px] font-bold text-text">{soldier.name}</div>
                    <div className="truncate font-mono text-[9px] uppercase tracking-wider text-gold-soft">{getRankName(soldier.rank)}</div>
                  </div>
                </div>

                <div
                  className="grid flex-1 min-w-0 grid-cols-2 grid-rows-2 gap-1 border-l border-gold/15 pl-1.5"
                  aria-label="Estado del soldado"
                >
                  <ResourceChip
                    icon="honor"
                    label="Honor"
                    value={soldier.honor}
                    tone="text-gold-soft"
                  />
                  <ResourceChip
                    icon="missions"
                    label="Fama"
                    value={soldier.reputation >= 0 ? `+${soldier.reputation}` : soldier.reputation}
                    tone={soldier.reputation >= 0 ? "text-success" : "text-danger"}
                  />
                  <ResourceChip
                    icon="coins"
                    label="Dinero"
                    value={soldier.coins}
                    tone="text-gold"
                  />
                  <ResourceChip
                    icon="fatigue"
                    label="Fatiga"
                    value={`${soldier.fatigue}/100`}
                    tone={soldier.fatigue > 75 ? "text-danger" : "text-ember"}
                  />
                </div>
              </div>

              <div
                className="gladiatus-resource-rail"
                style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", padding: "4px", gap: "4px" }}
                aria-label="Acciones rapidas"
              >
                <QuickAction
                  href="/training"
                  icon="training"
                  label="Acciones"
                  value={actionsRemaining}
                  max={ACTION_MAX}
                  tone={actionsRemaining > 0 ? "text-gold" : "text-muted"}
                  onNavigate={() => playPageSound()}
                />
                <QuickAction
                  href="/missions"
                  icon="missions"
                  label="Misiones"
                  value={missionsRemaining}
                  max={ACTION_MAX}
                  tone={missionsRemaining > 0 ? "text-gold-soft" : "text-muted"}
                  onNavigate={() => playPageSound()}
                />
                <QuickAction
                  href="/arena"
                  icon="arena"
                  label="PvP"
                  value={pvpRemaining}
                  max={ACTION_MAX}
                  tone="text-ember"
                  onNavigate={() => playPageSound()}
                />
                <QuickAction
                  href="/missions"
                  icon="shield"
                  label="Guerra"
                  value={warRemaining}
                  max={ACTION_MAX}
                  tone="text-danger"
                  onNavigate={() => playPageSound()}
                />
              </div>
            </div>

            <div
              className="topbar-panel px-2 py-1.5 shadow-inner flex flex-row items-stretch gap-2"
              style={{ minHeight: "unset" }}
            >
              <Link
                href={overviewLink.href}
                title={overviewLink.label}
                onClick={() => playPageSound()}
                className="flex shrink-0 items-center gap-1.5 px-2 py-1 bg-gold/10 hover:bg-gold/20 border border-gold/45 rounded-xs transition-all group"
              >
                <UiAssetIcon id={overviewLink.icon} label={overviewLink.label} className="h-5 w-5" />
                <span className="font-sans font-bold uppercase tracking-wider text-gold group-hover:text-gold-soft truncate text-[11px]">
                  {overviewLink.label}
                </span>
              </Link>

              <div className="h-auto w-px self-stretch bg-iron/60" aria-hidden="true" />

              <div className="grid flex-1 grid-cols-4 gap-1.5">
                {dispatchLinks.map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    onClick={() => playPageSound()}
                    className="flex items-center gap-1.5 px-1.5 py-1 bg-panel/40 hover:bg-panel-raised border border-iron/60 hover:border-gold/50 rounded-xs transition-all w-full text-left group"
                  >
                    <UiAssetIcon id={icon} label={label} className="h-5 w-5" />
                    <span className="topbar-shortcut-label font-sans font-bold uppercase tracking-wider text-text-muted group-hover:text-gold truncate text-[11px]">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {(soldier.unpaidWages > 0 || soldier.banMissionsLeft > 0) && (
              <div className="flex flex-row items-center gap-2">
                {soldier.unpaidWages > 0 && (
                  <div className="flex-1 py-1 px-2 text-[10px] font-mono bg-orange-950/20 text-orange-400 border border-orange-800/30 rounded-xs text-center animate-pulse">
                    ALERTA: {soldier.unpaidWages} doblones atrasados.
                  </div>
                )}
                {soldier.banMissionsLeft > 0 && (
                  <div className="flex-1 py-1 px-2 text-[10px] font-mono bg-red-950/20 text-red-400 border border-red-900/30 rounded-xs text-center animate-pulse">
                    DESTIERRO: {soldier.banMissionsLeft} turnos.
                  </div>
                )}
              </div>
            )}
          </header>
        )}

        <div className="flex flex-col md:flex-row gap-4 p-4 items-start">
          <SidebarNav />

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
