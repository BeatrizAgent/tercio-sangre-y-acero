"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { playPageSound } from "@/lib/sounds";
import { regions } from "@/lib/regions";

const worldLinks = [
  { href: "/saints", label: "Santos", icon: "cityChurch" },
  { href: "/company", label: "Tercio", icon: "missions" },
  { href: "/rankings", label: "Clasificacion", icon: "honor" },
  { href: "/recruitment", label: "Reclutamiento", icon: "cityHouseOfTrade" },
] as const;

const navItems = [
  { href: "/city", label: "Ciudad", assetIcon: "city", category: "ciudad" },
  { href: "/church", label: "Iglesia", assetIcon: "cityChurch", category: "ciudad" },
  { href: "/training", label: "Entrenar", assetIcon: "training", category: "ciudad" },
  { href: "/armory", label: "Armeria", assetIcon: "armory", category: "ciudad" },
  { href: "/arena", label: "Arena", assetIcon: "arena", category: "ciudad" },
  { href: "/hospital", label: "Hospital", assetIcon: "hospital", category: "ciudad" },
  ...regions.map((region) => ({
    href: `/missions?region=${region.id}`,
    label: region.name,
    assetIcon: "missions" as const,
    category: "campana" as const,
    regionId: region.id,
  })),
] as const;

type NavCategory = "ciudad" | "campana";

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NavCategory>("ciudad");

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (pathname === "/missions" || pathname.startsWith("/missions/")) {
      const timer = window.setTimeout(() => setActiveCategory("campana"), 0);
      return () => window.clearTimeout(timer);
    }
    if (pathname === "/city" || pathname.startsWith("/city/")) {
      const timer = window.setTimeout(() => setActiveCategory("ciudad"), 0);
      return () => window.clearTimeout(timer);
    }
    const currentItem = navItems.find((item) => {
      const matches = pathname === item.href || pathname.startsWith(item.href + "/");
      if (!matches) return false;
      if ("regionId" in item) {
        return searchParams.get("region") === item.regionId;
      }
      return true;
    });
    if (currentItem) {
      const timer = window.setTimeout(() => {
        setActiveCategory(currentItem.category as NavCategory);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  if (!mounted) {
    return (
      <aside className="w-full md:w-60 bg-panel border border-iron flex flex-col justify-between shrink-0 rounded-xs p-4 shadow-md">
        <div className="text-center font-cinzel text-xs text-gold animate-pulse">
          Cargando campamento...
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar-shell w-full md:w-56 md:max-h-[calc(100vh-1.5rem)] bg-panel border border-iron flex flex-col rounded-xs shadow-md p-2 z-20">
      <div className="flex flex-col flex-1 min-h-0 gap-1.5">
        {/* World Links: compactos, sin cabecera */}
        <nav className="grid grid-cols-1 gap-0.5 shrink-0">
          {worldLinks.map(({ href, label, icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => playPageSound()}
                title={label}
                className={`sidebar-nav-item flex h-7 flex-row items-center gap-1.5 px-1.5 rounded-sm transition-all duration-200 border text-left relative overflow-hidden group ${
                  isActive
                    ? "is-active bg-panel-raised border-gold/35 text-gold font-bold shadow-sm"
                    : "border-iron/55 text-text-muted hover:bg-panel-soft/30 hover:text-text hover:border-gold/20"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-gold/0 via-gold/5 to-gold/0 pointer-events-none" />
                )}
                <span
                  className={`relative flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-sm border ${
                    isActive
                      ? "border-gold/35 bg-background/70"
                      : "border-iron/70 bg-background/35 group-hover:border-gold/20"
                  }`}
                >
                  <UiAssetIcon id={icon} label={label} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate font-cinzel text-[10px] font-bold uppercase leading-tight tracking-[0.04em] text-text">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Tab bar + nav items */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex border border-iron/80 mb-1.5 bg-panel-soft/20 rounded-xs overflow-hidden shadow-inner shrink-0">
            <Link
              href="/city"
              onClick={() => playPageSound()}
              className={`flex-1 h-8 flex items-center justify-center gap-1 transition-all cursor-pointer border-r border-iron/60 ${
                activeCategory === "ciudad"
                  ? "bg-blood/15 text-gold font-bold shadow-[inset_0_-2px_0_0_#c9a24f]"
                  : "text-text-muted hover:text-text hover:bg-panel-soft/10"
              }`}
              title="Cosas de la Ciudad"
            >
              <UiAssetIcon id="city" label="Ciudad" className="h-3.5 w-3.5" />
              <span className="font-sans text-[9.5px] font-bold uppercase tracking-wider">Ciudad</span>
            </Link>
            <Link
              href="/missions"
              onClick={() => playPageSound()}
              className={`flex-1 h-8 flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeCategory === "campana"
                  ? "bg-blood/15 text-gold font-bold shadow-[inset_0_-2px_0_0_#c9a24f]"
                  : "text-text-muted hover:text-text hover:bg-panel-soft/10"
              }`}
              title="Cosas de la Campana"
            >
              <UiAssetIcon id="missions" label="Campana" className="h-3.5 w-3.5" />
              <span className="font-sans text-[9.5px] font-bold uppercase tracking-wider">Campana</span>
            </Link>
          </div>

          <nav className="grid grid-cols-1 gap-0.5">
            {navItems
              .filter((item) => item.category === activeCategory)
              .map((item) => {
                const matchesPath = pathname === item.href || pathname.startsWith(item.href + "/");
                let isActive = matchesPath;
                if (isActive && "regionId" in item) {
                  isActive = searchParams.get("region") === item.regionId;
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => playPageSound()}
                    title={item.label}
                    className={`sidebar-nav-item flex h-8 flex-row items-center gap-1.5 px-1.5 rounded-sm transition-all duration-200 border text-left relative overflow-hidden group ${
                      isActive
                        ? "is-active bg-panel-raised border-gold/35 text-gold font-bold shadow-sm"
                        : "border-iron/55 text-text-muted hover:bg-panel-soft/30 hover:text-text hover:border-gold/20"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-gold/0 via-gold/5 to-gold/0 pointer-events-none" />
                    )}
                    <span
                      className={`sidebar-nav-icon relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-sm border transition-all duration-300 ${
                        isActive
                          ? "border-gold/35 bg-background/70 shadow-[0_0_16px_rgba(201,162,79,0.16)]"
                          : "border-iron/70 bg-background/35 group-hover:border-gold/20"
                      }`}
                    >
                      <UiAssetIcon id={item.assetIcon} label={item.label} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-cinzel text-[10.5px] font-bold uppercase leading-tight tracking-[0.04em] text-text">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
