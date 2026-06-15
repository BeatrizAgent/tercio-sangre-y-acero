"use client";

import React, { useEffect, useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import { UiAssetIcon } from "./ui-asset-icon";
import { useGameStore } from "@/lib/game-store";
import { getRankName } from "@/lib/game-data";

export function GameShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const soldier = useGameStore((state) => state.soldier);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-row bg-background text-text font-sans selection:bg-gold/30 selection:text-gold-soft w-screen h-screen overflow-hidden">
      {/* Sidebar - fixed and scrollable independently */}
      <SidebarNav />

      {/* Main Game Viewport - scrollable independently */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col bg-background">
        {mounted && (
          <header className="top-command-bar sticky top-0 z-10 hidden min-h-28 items-center justify-between border-b border-iron px-5 md:flex">
            <div className="flex items-center gap-3">
              <UiAssetIcon id="missions" label="Tercio" className="h-18 w-18" />
              <div>
                <p className="font-blackletter text-4xl leading-none text-gold">Tercio</p>
                <p className="font-cinzel text-sm font-bold uppercase tracking-[0.18em] text-gold-soft">
                  Sangre y Acero
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 xl:gap-5">
              <div className="top-resource">
                <UiAssetIcon id="coins" label="Doblones" className="h-10 w-10" />
                <span>Doblones</span>
                <strong>{soldier.coins}</strong>
              </div>
              <div className="top-resource">
                <UiAssetIcon id="honor" label="Honor" className="h-10 w-10" />
                <span>Honor</span>
                <strong>{soldier.honor}</strong>
              </div>
              <div className="top-resource">
                <UiAssetIcon id="xp" label="Experiencia" className="h-10 w-10" />
                <span>XP</span>
                <strong>{soldier.xp}</strong>
              </div>
              <div className="top-resource">
                <UiAssetIcon id="fatigue" label="Fatiga" className="h-10 w-10" />
                <span>Fatiga</span>
                <strong className={soldier.fatigue > 70 ? "text-danger" : ""}>{soldier.fatigue} / 100</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-iron pl-5">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-gold/30 bg-background/60">
                <UiAssetIcon id="soldier" label="Diego de Arce" className="h-16 w-16" />
              </div>
              <div className="text-right">
                <p className="font-cinzel text-lg font-bold text-text">{soldier.name}</p>
                <p className="text-base text-text-muted">{getRankName(soldier.rank)}</p>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 p-4 md:p-5 lg:p-6 max-w-[1720px] w-full mx-auto">
          {!mounted ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center space-y-4">
                <div className="w-10 h-10 border-2 border-t-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto" />
                <p className="font-cinzel text-sm text-gold tracking-widest uppercase animate-pulse">
                  Estableciendo Campamento...
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
