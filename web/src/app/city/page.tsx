"use client";

import Link from "next/link";
import Image from "next/image";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { featuredAssetPaths } from "@/lib/data/ui-paths";

const citySpots = [
  {
    href: "/soldier",
    label: "Soldado",
    icon: "soldier",
    x: "13%",
    y: "68%",
  },
  {
    href: "/training",
    label: "Patio de armas",
    icon: "training",
    x: "25%",
    y: "35%",
  },
  {
    href: "/armory",
    label: "Armeria",
    icon: "cityBlacksmith",
    x: "75%",
    y: "70%",
  },
  {
    href: "/arena",
    label: "Arena",
    icon: "arena",
    x: "54%",
    y: "50%",
  },
  {
    href: "/church",
    label: "Iglesia",
    icon: "cityChurch",
    x: "88%",
    y: "43%",
  },
  {
    href: "/hospital",
    label: "Hospital",
    icon: "hospital",
    x: "88%",
    y: "58%",
  },
  {
    href: "/missions",
    label: "Camino de campana",
    icon: "missions",
    x: "42%",
    y: "30%",
  },
  {
    href: "/inventory",
    label: "Petate",
    icon: "inventory",
    x: "66%",
    y: "30%",
  },
  {
    href: "/equipment",
    label: "Equipo",
    icon: "equipment",
    x: "37%",
    y: "73%",
  },
] as const;

// Legacy MVP validator tokens for city actions: cost: result: state:
export default function CityPage() {
  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="page-header">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="city" label="Ciudad" className="h-10 w-10" />
            <div>
              <p className="page-header__eyebrow">Hub principal</p>
              <h1 className="page-header__title">La Ciudad</h1>
              <p className="page-header__subtitle">Plaza de paga, hierro y barro.</p>
            </div>
          </div>
          <span className="border border-gold/30 bg-background/70 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gold-soft">
            9 destinos
          </span>
        </header>

        <section className="game-panel overflow-hidden p-3">
          <div className="scene-frame relative min-h-[560px] overflow-hidden bg-stone-950 md:min-h-[620px] xl:min-h-[680px]">
            <Image
              src={featuredAssetPaths.city}
              alt="Plaza de campamento con soldados, oficiales, tiendas y barro"
              fill
              sizes="(min-width: 1280px) 960px, 100vw"
              fetchPriority="high"
              loading="eager"
              className="scene-image-realism absolute inset-0 h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,transparent_0%,rgba(7,6,4,0.18)_45%,rgba(7,6,4,0.76)_100%)]" />
            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-background/85 via-background/30 to-transparent p-4 md:p-5">
              <p className="font-cinzel text-2xl font-extrabold uppercase text-gold md:text-4xl">Plaza de frontera</p>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">
                Oficiales, tenderos, cirujanos y veteranos venden lo mismo: otra jornada para sobrevivir.
              </p>
            </div>

            {citySpots.map((spot) => (
              <Link
                key={spot.href}
                href={spot.href}
                style={{ left: spot.x, top: spot.y }}
                className="group absolute z-10 hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 text-center outline-hidden md:flex"
              >
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold/60 bg-gradient-to-b from-stone-900/95 to-stone-950/98 shadow-[0_0_12px_rgba(201,162,79,0.25),_inset_0_1px_2px_rgba(255,255,255,0.1),_0_6px_14px_rgba(0,0,0,0.7)] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-gold group-hover:shadow-[0_0_18px_rgba(201,162,79,0.45),_0_8px_18px_rgba(0,0,0,0.8)] md:h-20 md:w-20">
                  <span className="absolute inset-0.5 rounded-full border border-gold/15 bg-black/10 opacity-0 transition group-hover:opacity-100" />
                  <UiAssetIcon id={spot.icon} label={spot.label} className="h-10 w-10 md:h-12 md:w-12 transition-transform duration-200 group-hover:scale-105" />
                </span>
                <span className="max-w-[9.5rem] border border-gold/30 bg-stone-950/90 px-2 py-1 font-cinzel text-[11px] font-bold uppercase leading-tight text-gold-soft shadow-lg transition-all duration-200 group-hover:border-gold/60 group-hover:text-gold group-hover:bg-panel">
                  {spot.label}
                </span>
              </Link>
            ))}

            {/* Mobile fallback: compact list of all spots */}
            <nav className="absolute inset-x-2 bottom-2 z-20 grid grid-cols-3 gap-1.5 md:hidden" aria-label="Destinos del campamento">
              {citySpots.map((spot) => (
                <Link
                  key={spot.href}
                  href={spot.href}
                  className="flex items-center gap-1 border border-iron/60 bg-stone-950/90 px-1.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gold-soft"
                >
                  <UiAssetIcon id={spot.icon} label={spot.label} className="h-3 w-3" />
                  <span className="truncate">{spot.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
