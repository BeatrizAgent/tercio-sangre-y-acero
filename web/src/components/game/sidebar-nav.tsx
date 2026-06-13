"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  RotateCcw, 
  Tent, 
  User, 
  Swords, 
  Backpack, 
  Shield, 
  Hammer, 
  Map, 
  HeartPulse,
  Coins,
  Trophy,
  Star,
  Flame,
  ShieldAlert
} from "lucide-react";
import { useGameStore } from "@/lib/game-store";
import { getRankName } from "@/lib/game-data";

export function SidebarNav() {
  const pathname = usePathname();
  const resetState = useGameStore((state) => state.resetState);
  const soldier = useGameStore((state) => state.soldier);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: "/barracks", label: "Cuartel", icon: Tent },
    { href: "/soldier", label: "Soldado", icon: User },
    { href: "/training", label: "Entrenar", icon: Swords },
    { href: "/inventory", label: "Inventario", icon: Backpack },
    { href: "/equipment", label: "Equipo", icon: Shield },
    { href: "/armory", label: "Armería", icon: Hammer },
    { href: "/missions", label: "Misiones", icon: Map },
    { href: "/hospital", label: "Hospital", icon: HeartPulse },
  ];

  if (!mounted) {
    return (
      <aside className="w-20 md:w-64 bg-panel border-r border-iron flex flex-col justify-between h-screen shrink-0 game-scrollbar overflow-y-auto">
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
    <aside className="w-20 md:w-64 bg-panel border-r border-iron flex flex-col justify-between h-screen shrink-0 game-scrollbar overflow-y-auto z-20">
      <div className="flex flex-col flex-1">
        {/* Logo / Header Title */}
        <div className="p-4 border-b border-iron bg-panel-soft/20 flex flex-col items-center md:items-start shrink-0">
          <h1 className="font-blackletter text-xl md:text-2xl font-bold tracking-wide text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            TERCIO
          </h1>
          <p className="text-[8px] md:text-[9px] tracking-[0.25em] text-blood-bright uppercase font-bold hidden md:block">
            Sangre y Acero
          </p>
        </div>

        {/* Soldier Profile & Resources Header (Desktop only) */}
        <div className="hidden md:block p-4 border-b border-iron bg-background/25 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-sm bg-panel-soft border border-iron flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-gold-soft" />
            </div>
            <div className="min-w-0">
              <h2 className="font-cinzel text-sm font-bold text-text truncate leading-tight">{soldier.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] bg-blood/40 border border-blood-bright/20 px-1.5 py-0.2 text-gold-soft uppercase tracking-wider font-mono font-bold">
                  {getRankName(soldier.rank)}
                </span>
              </div>
            </div>
          </div>

          {/* Resources Row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Doblones */}
            <div className="bg-background/40 border border-iron/80 px-2 py-1.5 rounded-sm flex items-center gap-2">
              <Coins className="w-4 h-4 text-gold shrink-0" />
              <div className="min-w-0">
                <p className="text-[8px] text-text-muted uppercase font-sans tracking-wider">Doblones</p>
                <p className="font-mono text-xs font-bold text-gold-soft truncate">{soldier.coins}</p>
              </div>
            </div>
            {/* Honor */}
            <div className="bg-background/40 border border-iron/80 px-2 py-1.5 rounded-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber shrink-0" />
              <div className="min-w-0">
                <p className="text-[8px] text-text-muted uppercase font-sans tracking-wider">Honor</p>
                <p className="font-mono text-xs font-bold text-text truncate">{soldier.honor}</p>
              </div>
            </div>
          </div>

          {/* Gauges (XP & Fatigue) */}
          <div className="space-y-3">
            {/* XP Progress */}
            <div className="text-[10px]">
              <div className="flex justify-between text-text-muted font-sans uppercase tracking-wider mb-1">
                <span>Experiencia</span>
                <span className="font-mono text-[9px] font-bold text-text">
                  {soldier.xp} {nextRankDef ? `/ ${nextRankDef.minXp}` : ""}
                </span>
              </div>
              <div className="w-full bg-stone-900 border border-stone-800/80 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gold h-full transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Fatigue Progress */}
            <div className="text-[10px]">
              <div className="flex justify-between text-text-muted font-sans uppercase tracking-wider mb-1">
                <span>Fatiga</span>
                <span className="font-mono text-[9px] font-bold text-text">{soldier.fatigue}/100</span>
              </div>
              <div className="w-full bg-stone-900 border border-stone-800/80 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${soldier.fatigue > 75 ? "bg-danger" : "bg-ember"}`}
                  style={{ width: `${soldier.fatigue}%` }}
                />
              </div>
            </div>
          </div>

          {/* Debts Warning */}
          {soldier.unpaidWages > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-danger/10 border border-danger/30 px-2.5 py-1.5 text-[10px] text-danger rounded-sm animate-pulse">
              <ShieldAlert className="w-4 h-4 text-danger shrink-0" />
              <span className="font-mono font-bold uppercase tracking-wider">Deuda: {soldier.unpaidWages} dob.</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="py-4 px-2 md:px-3 flex-1">
          <p className="text-[9px] text-text-muted font-cinzel uppercase tracking-[0.2em] mb-3 border-b border-iron pb-1.5 text-center md:text-left hidden md:block">
            Campamento
          </p>
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2.5 md:px-4 md:py-3 rounded-md transition-all duration-200 border text-center md:text-left relative overflow-hidden group ${
                    isActive
                      ? "bg-panel-raised border-gold/20 text-gold font-bold shadow-sm border-l-4 border-l-gold"
                      : "bg-transparent border-transparent text-text-muted hover:bg-panel-soft/30 hover:text-text"
                  }`}
                >
                  {/* Active light sweep indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-gold/0 via-gold/5 to-gold/0 pointer-events-none" />
                  )}
                  <IconComponent
                    className={`w-6 h-6 md:w-5 md:h-5 transition-all duration-300 shrink-0 group-hover:scale-110 ${
                      isActive
                        ? "text-gold drop-shadow-[0_0_3px_rgba(201,162,79,0.35)]"
                        : "text-text-muted group-hover:text-text"
                    }`}
                  />
                  <span className="max-w-full text-center font-cinzel text-[9px] font-semibold uppercase leading-tight tracking-[0.03em] [overflow-wrap:anywhere] md:text-left md:text-[13px]">
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
          className="flex items-center justify-center gap-2 px-3 py-1.5 border border-stone-850 hover:border-danger/40 hover:bg-danger/10 text-[10px] uppercase font-sans tracking-wider text-muted hover:text-danger transition-all rounded-sm cursor-pointer w-full md:w-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reiniciar Progreso</span>
        </button>

        {/* Motto */}
        <div className="hidden w-full border-t border-dashed border-iron/40 py-2 text-center font-cinzel text-[11px] font-semibold tracking-[0.16em] text-gold/60 md:block">
          DIOS · HONOR · REY
        </div>
      </div>
    </aside>
  );
}
