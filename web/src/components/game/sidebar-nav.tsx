"use client";

import React, { useEffect, useState, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { playPageSound } from "@/lib/sounds";
import { regions } from "@/lib/regions";
import { useGameStore } from "@/lib/game-store";
import { prologueStoryArc } from "@/lib/game-data";

interface NavLinkProps {
  href: string;
  label: string;
  icon: ComponentProps<typeof UiAssetIcon>["id"];
  isActive: boolean;
}

function NavLink({ href, label, icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => playPageSound()}
      title={label}
      className={`gladiatus-location-button ${isActive ? "active" : ""} gap-2`}
    >
      <UiAssetIcon id={icon} label={label} className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function chunkStoryChapters<T>(items: T[], groups: number): T[][] {
  return Array.from({ length: groups }, (_, groupIndex) => {
    const start = Math.floor((groupIndex * items.length) / groups);
    const end = Math.floor(((groupIndex + 1) * items.length) / groups);
    return items.slice(start, end);
  }).filter((group) => group.length > 0);
}

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { soldier, storyProgress } = useGameStore();
  const [regenTimer, setRegenTimer] = useState<string>("");

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const computeTimer = (): string => {
      const state = useGameStore.getState();
      const s = state.soldier;
      const pts = s.actionPoints !== undefined ? s.actionPoints : 12;
      if (pts >= 12 || !s.lastRegenAt) {
        return "";
      }

      const nextRegenTime = new Date(s.lastRegenAt).getTime() + 30 * 60 * 1000;
      const now = Date.now();
      const remainingMs = nextRegenTime - now;

      if (remainingMs <= 0) {
        return "";
      }

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    };

    // Defer the first read by one tick so the effect body only schedules
    // side effects and never calls setState synchronously (avoids the
    // "setState in effect" lint and any cascading-render warnings).
    const initial = window.setTimeout(() => {
      setRegenTimer(computeTimer());
    }, 0);
    const interval = window.setInterval(() => {
      const next = computeTimer();
      setRegenTimer((current) => (current === next ? current : next));
      // When the timer resets to empty, the store has already advanced to
      // max; trigger a rehydrate so the UI shows the new value immediately.
      if (next === "" && useGameStore.getState().soldier.actionPoints !== 12) {
        useGameStore.getState().hydrateState({ ...useGameStore.getState() });
      }
    }, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [mounted, soldier.actionPoints, soldier.lastRegenAt]);

  if (!mounted) {
    return (
      <aside className="w-full md:w-56 bg-panel border border-iron flex flex-col justify-between shrink-0 rounded-xs p-4 shadow-md">
        <div className="text-center font-cinzel text-xs text-gold animate-pulse">
          Cargando campamento...
        </div>
      </aside>
    );
  }

  // Active status helper functions
  const isRouteActive = (route: string) => pathname === route || pathname.startsWith(route + "/");
  const campaignMode = searchParams.get("mode") === "story" ? "story" : "campaign";
  const isCampaignRoute = pathname === "/missions";
  const isRegionActive = (regionId: string) =>
    isCampaignRoute && campaignMode === "campaign" && searchParams.get("region") === regionId;
  const storyGroups = chunkStoryChapters(prologueStoryArc.chapters, 5);
  const activeStoryChapterId = storyProgress?.currentChapterId ?? prologueStoryArc.chapters[0]?.id;

  return (
    <aside className="sidebar-shell w-full md:w-56 md:max-h-[calc(100vh-1.5rem)] bg-panel border border-iron flex flex-col rounded-xs shadow-md p-2 z-20 overflow-y-auto">
      <div className="flex flex-col flex-1 min-h-0 gap-3">
        {/* Puntos de Acción */}
        <div className="game-panel border border-iron bg-stone-950/60 p-2.5 rounded-xs space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted flex items-center gap-1">
              <UiAssetIcon id="missions" label="Puntos de Acción" className="h-3.5 w-3.5" />
              Puntos Acción
            </span>
            <span className="font-mono text-xs font-bold text-gold">
              {soldier.actionPoints !== undefined ? soldier.actionPoints : 12} / 12
            </span>
          </div>
          <div className="w-full bg-stone-900 border border-iron/40 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gold h-full transition-all duration-300"
              style={{ width: `${((soldier.actionPoints !== undefined ? soldier.actionPoints : 12) / 12) * 100}%` }}
            />
          </div>
          {regenTimer && (
            <div className="font-mono text-[9px] text-right text-text-muted uppercase">
              Sig. punto en <span className="text-gold-soft">{regenTimer}</span>
            </div>
          )}
        </div>

        {/* LOCALIZACIÓN SECTION */}
        <div>
          <div className="gladiatus-section-header">Localización</div>
          <nav className="flex flex-col gap-1 pl-1">
            <NavLink
              href="/city"
              label="Ciudad"
              icon="city"
              isActive={isRouteActive("/city")}
            />
            <NavLink
              href="/church"
              label="Iglesia"
              icon="cityChurch"
              isActive={isRouteActive("/church")}
            />
            <NavLink
              href="/training"
              label="Entrenar"
              icon="training"
              isActive={isRouteActive("/training")}
            />
            <NavLink
              href="/armory"
              label="Armería"
              icon="armory"
              isActive={isRouteActive("/armory")}
            />
            <NavLink
              href="/market"
              label="Subasta"
              icon="cityHouseOfTrade"
              isActive={isRouteActive("/market")}
            />
            <NavLink
              href="/arena"
              label="Arena"
              icon="arena"
              isActive={isRouteActive("/arena")}
            />
            <NavLink
              href="/hospital"
              label="Hospital"
              icon="hospital"
              isActive={isRouteActive("/hospital")}
            />
          </nav>
        </div>

        {/* CAMPAÑA SECTION */}
        <div>
          <div className="gladiatus-section-header">Campaña</div>
          <nav className="flex flex-col gap-1 pl-1">
            <div role="tablist" className="mb-1 grid grid-cols-2 gap-1">
              <Link
                href="/missions"
                onClick={() => playPageSound()}
                role="tab"
                aria-selected={isCampaignRoute && campaignMode === "campaign"}
                title="Campaña"
                className={`gladiatus-location-button justify-center gap-1 px-1 text-center ${
                  isCampaignRoute && campaignMode === "campaign" ? "active" : ""
                }`}
              >
                <UiAssetIcon id="missions" label="" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Campaña</span>
              </Link>
              <Link
                href="/missions?mode=story"
                onClick={() => playPageSound()}
                role="tab"
                aria-selected={isCampaignRoute && campaignMode === "story"}
                title="Historia"
                className={`gladiatus-location-button justify-center gap-1 px-1 text-center ${
                  isCampaignRoute && campaignMode === "story" ? "active" : ""
                }`}
              >
                <UiAssetIcon id="order" label="" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Historia</span>
              </Link>
            </div>

            {campaignMode === "campaign" && regions.map((region) => (
              <NavLink
                key={region.id}
                href={`/missions?region=${region.id}`}
                label={region.name}
                icon="missions"
                isActive={isRegionActive(region.id)}
              />
            ))}
            {campaignMode === "story" && storyGroups.map((group, index) => (
              <NavLink
                key={group[0]?.id ?? index}
                href="/missions?mode=story"
                label={`Acto ${index + 1}`}
                icon="order"
                isActive={isCampaignRoute && group.some((chapter) => chapter.id === activeStoryChapterId)}
              />
            ))}
          </nav>
        </div>

        {/* COMUNIDAD SECTION */}
        <div>
          <div className="gladiatus-section-header">Comunidad</div>
          <nav className="flex flex-col gap-1 pl-1">
            <NavLink
              href="/saints"
              label="Santos"
              icon="cityChurch"
              isActive={isRouteActive("/saints")}
            />
            <NavLink
              href="/company"
              label="Tercio"
              icon="missions"
              isActive={isRouteActive("/company")}
            />
            <NavLink
              href="/rankings"
              label="Clasificación"
              icon="honor"
              isActive={isRouteActive("/rankings")}
            />
            <NavLink
              href="/players"
              label="Soldados"
              icon="rank"
              isActive={isRouteActive("/players")}
            />
            <NavLink
              href="/recruitment"
              label="Reclutamiento"
              icon="cityHouseOfTrade"
              isActive={isRouteActive("/recruitment")}
            />
          </nav>
        </div>
      </div>
    </aside>
  );
}
