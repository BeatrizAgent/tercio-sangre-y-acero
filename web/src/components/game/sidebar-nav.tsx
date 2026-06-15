"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGameStore } from "@/lib/game-store";
import { getRankName } from "@/lib/game-data";
import { UiAssetIcon } from "./ui-asset-icon";

export function SidebarNav() {
  const pathname = usePathname();
  const resetState = useGameStore((state) => state.resetState);
  const soldier = useGameStore((state) => state.soldier);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const navItems = [
    { href: "/barracks", label: "Cuartel", assetIcon: "barracks" },
    { href: "/soldier", label: "Soldado", assetIcon: "soldier" },
    { href: "/training", label: "Entrenar", assetIcon: "training" },
    { href: "/inventory", label: "Inventario", assetIcon: "inventory" },
    { href: "/equipment", label: "Equipo", assetIcon: "equipment" },
    { href: "/armory", label: "Armería", assetIcon: "armory" },
    { href: "/missions", label: "Misiones", assetIcon: "missions" },
    { href: "/hospital", label: "Hospital", assetIcon: "hospital" },
  ] as const;

  if (!mounted) {
    return (
      <aside className="w-24 md:w-72 bg-panel border-r border-iron flex flex-col justify-between h-screen shrink-0 game-scrollbar overflow-y-auto">
        <div className="p-4 text-center font-cinzel text-xs text-gold animate-pulse">
          Cargando campamento...
        </div>
      </aside>
    );
  }

  // Rank calculations
  const rankDefinitions = [
    { id: "bisono", name: "bisoño", minXp: 0, minHonor: 0 },
    { id: "soldado", name: "soldado", minXp: 20, minHonor: 2 },
    { id: "soldado_viejo", name: "soldado viejo", minXp: 60, minHonor: 8 },
    { id: "cabo_de_escuadra", name: "cabo de escuadra", minXp: 110, minHonor: 18 },
    { id: "sargento", name: "sargento", minXp: 180, minHonor: 32 },
    { id: "alferez", name: "alférez", minXp: 260, minHonor: 50 },
    { id: "capitan", name: "capitán", minXp: 380, minHonor: 80 },
  ];
  
  const currentRankIdx = rankDefinitions.findIndex((r) => r.id === soldier.rank);
  const nextRankDef = currentRankIdx !== -1 && currentRankIdx < rankDefinitions.length - 1 
    ? rankDefinitions[currentRankIdx + 1] 
    : null;

  const xpProgress = nextRankDef 
    ? Math.min(100, Math.max(0, ((soldier.xp - rankDefinitions[currentRankIdx].minXp) / (nextRankDef.minXp - rankDefinitions[currentRankIdx].minXp)) * 100))
    : 100;

  return (
    <aside className="sidebar-shell w-24 md:w-80 bg-panel border-r border-iron flex flex-col justify-between h-screen shrink-0 game-scrollbar overflow-y-auto z-20">
      <div className="flex flex-col flex-1">
        {/* Logo / Header Title */}
        <div className="sidebar-brand p-4 border-b border-iron bg-panel-soft/20 flex flex-col items-center md:items-start shrink-0">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="missions" label="Tercio" className="h-10 w-10 md:h-14 md:w-14" />
            <h1 className="font-blackletter text-2xl md:text-4xl font-bold tracking-wide text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              TERCIO
            </h1>
          </div>
          <p className="text-sm tracking-[0.18em] text-blood-bright uppercase font-bold hidden md:block">
            Sangre y Acero
          </p>
        </div>

        {/* Soldier Profile & Resources Header (Desktop only) */}
        <div className="hidden md:block p-4 border-b border-iron bg-background/25 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-sm bg-panel-soft border border-iron flex items-center justify-center shrink-0 overflow-hidden">
              <UiAssetIcon id="rank" label="Rango" className="h-12 w-12" />
            </div>
            <div className="min-w-0">
              <h2 className="font-cinzel text-xl font-bold text-text truncate leading-tight">{soldier.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm bg-blood/40 border border-blood-bright/20 px-2 py-1 text-gold-soft uppercase tracking-wider font-mono font-bold">
                  {getRankName(soldier.rank)}
                </span>
              </div>
            </div>
          </div>

          {/* Resources Row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Doblones */}
            <div className="bg-background/40 border border-iron/80 px-3 py-2 rounded-sm flex items-center gap-3">
              <UiAssetIcon id="coins" label="Doblones" className="h-9 w-9" />
              <div className="min-w-0">
                <p className="text-xs text-text-muted uppercase font-sans tracking-wider">Oro</p>
                <p className="font-mono text-xl font-bold text-gold-soft truncate">{soldier.coins}</p>
              </div>
            </div>
            {/* Honor */}
            <div className="bg-background/40 border border-iron/80 px-3 py-2 rounded-sm flex items-center gap-3">
              <UiAssetIcon id="honor" label="Honor" className="h-9 w-9" />
              <div className="min-w-0">
                <p className="text-xs text-text-muted uppercase font-sans tracking-wider">Honor</p>
                <p className="font-mono text-xl font-bold text-text truncate">{soldier.honor}</p>
              </div>
            </div>
          </div>

          {/* Gauges (XP & Fatigue) */}
          <div className="space-y-3">
            {/* XP Progress */}
            <div className="text-sm">
              <div className="flex justify-between text-text-muted font-sans uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1.5">
                  <UiAssetIcon id="xp" label="Experiencia" className="h-7 w-7" />
                  <span>XP</span>
                </span>
                <span className="font-mono text-sm font-bold text-text">
                  {soldier.xp} {nextRankDef ? `/ ${nextRankDef.minXp}` : ""}
                </span>
              </div>
              <div className="w-full bg-stone-900 border border-stone-800/80 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gold h-full transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Fatigue Progress */}
            <div className="text-sm">
              <div className="flex justify-between text-text-muted font-sans uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1.5">
                  <UiAssetIcon id="fatigue" label="Fatiga" className="h-7 w-7" />
                  <span>Fatiga</span>
                </span>
                <span className="font-mono text-sm font-bold text-text">{soldier.fatigue}/100</span>
              </div>
              <div className="w-full bg-stone-900 border border-stone-800/80 h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${soldier.fatigue > 75 ? "bg-danger" : "bg-ember"}`}
                  style={{ width: `${soldier.fatigue}%` }}
                />
              </div>
            </div>

            {/* Reputation & Corruption */}
            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-iron/20">
              <div>
                <span className="text-text-muted font-sans uppercase tracking-[0.05em] block mb-0.5">Fama</span>
                <span className={`font-mono font-bold ${soldier.reputation >= 0 ? "text-success" : "text-danger"}`}>
                  {soldier.reputation >= 0 ? `+${soldier.reputation}` : soldier.reputation}
                </span>
              </div>
              <div>
                <span className="text-text-muted font-sans uppercase tracking-[0.05em] block mb-0.5">Corrupción</span>
                <span className={`font-mono font-bold ${soldier.corruption >= 50 ? "text-danger font-semibold animate-pulse" : "text-text"}`}>
                  {soldier.corruption}%
                </span>
              </div>
            </div>
          </div>

          {/* Debts Warning */}
          {soldier.unpaidWages > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-danger/10 border border-danger/30 px-2.5 py-1.5 text-[10px] text-danger rounded-sm animate-pulse">
              <UiAssetIcon id="confirm" label="Advertencia" className="h-6 w-6" />
              <span className="font-mono font-bold uppercase tracking-wider">Deuda: {soldier.unpaidWages} dob.</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="py-4 px-2 md:px-3 flex-1">
          <p className="text-sm text-text-muted font-cinzel uppercase tracking-[0.2em] mb-3 border-b border-iron pb-1.5 text-center md:text-left hidden md:block">
            Campamento
          </p>
          <nav className="flex flex-col gap-2.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item flex flex-col md:flex-row items-center gap-1.5 md:gap-4 p-2.5 md:px-4 md:py-3 rounded-sm transition-all duration-200 border text-center md:text-left relative overflow-hidden group ${
                    isActive
                      ? "is-active bg-panel-raised border-gold/35 text-gold font-bold shadow-sm"
                      : "border-iron/55 text-text-muted hover:bg-panel-soft/30 hover:text-text hover:border-gold/20"
                  }`}
                >
                  {/* Active light sweep indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-gold/0 via-gold/5 to-gold/0 pointer-events-none" />
                  )}
                  <span
                    className={`sidebar-nav-icon relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border transition-all duration-300 md:h-16 md:w-16 ${
                      isActive
                        ? "border-gold/35 bg-background/70 shadow-[0_0_16px_rgba(201,162,79,0.16)]"
                        : "border-iron/70 bg-background/35 group-hover:border-gold/20"
                    }`}
                  >
                    <UiAssetIcon id={item.assetIcon} label={item.label} className="h-[58px] w-[58px] md:h-[66px] md:w-[66px]" />
                  </span>
                  <span className="max-w-full text-center font-cinzel text-xs font-semibold uppercase leading-tight tracking-[0.03em] [overflow-wrap:anywhere] md:text-left md:text-[20px]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Area */}
      <div className="p-2 md:p-4 border-t border-iron bg-background/30 flex flex-col items-center gap-3 shrink-0">
        {/* Reset button for demo purposes */}
        <button
          onClick={() => {
            if (confirm("¿Seguro que deseas reiniciar el progreso del soldado?")) {
              resetState();
              window.location.href = "/barracks";
            }
          }}
          className="flex items-center justify-center gap-2 px-3 py-1.5 border border-stone-850 hover:border-danger/40 hover:bg-danger/10 text-[12px] uppercase font-sans tracking-wider text-muted hover:text-danger transition-all rounded-sm cursor-pointer w-full md:w-auto"
        >
          <UiAssetIcon id="settings" label="Reiniciar" className="h-5 w-5" />
          <span className="hidden md:inline">Reiniciar Progreso</span>
        </button>

        {/* Motto */}
        <div className="hidden w-full border-t border-dashed border-iron/40 py-2 text-center font-cinzel text-xs font-semibold tracking-[0.14em] text-gold/60 md:block">
          DIOS · HONOR · REY
        </div>
      </div>
    </aside>
  );
}
