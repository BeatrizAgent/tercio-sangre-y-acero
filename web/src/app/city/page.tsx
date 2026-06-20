"use client";

import Link from "next/link";
import Image from "next/image";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { featuredAssetPaths } from "@/lib/game-data";

const citySpots = [
  {
    href: "/soldier",
    label: "Soldado",
    icon: "soldier",
    x: "13%",
    y: "68%",
    note: "Perfil, atributos, equipo y companeros.",
    cost: "Sin coste",
    result: "Hoja de servicio clara.",
    state: "Lista de tropa",
  },
  {
    href: "/training",
    label: "Patio de armas",
    icon: "training",
    x: "25%",
    y: "35%",
    note: "Pica, espada, arcabuz, disciplina y vigor.",
    cost: "Doblones y fatiga",
    result: "Mas poder real.",
    state: "Sargento gritando",
  },
  {
    href: "/armory",
    label: "Armeria",
    icon: "cityBlacksmith",
    x: "75%",
    y: "70%",
    note: "Compra, venta y mejora de equipo.",
    cost: "Doblones",
    result: "Mejor equipo.",
    state: "Martillos al rojo",
  },
  {
    href: "/arena",
    label: "Arena",
    icon: "arena",
    x: "54%",
    y: "50%",
    note: "Duelos locales por honor y moneda corta.",
    cost: "Fatiga y riesgo",
    result: "Honor, XP y paga.",
    state: "Apuestas abiertas",
  },
  {
    href: "/church",
    label: "Iglesia",
    icon: "cityChurch",
    x: "88%",
    y: "43%",
    note: "Encargos, amuletos, reliquias y bendiciones.",
    cost: "Ofrendas y doblones",
    result: "Honor, calma y proteccion.",
    state: "Cirios encendidos",
  },
  {
    href: "/hospital",
    label: "Hospital",
    icon: "hospital",
    x: "88%",
    y: "58%",
    note: "Vendas, cirujano, fiebre y recuperacion.",
    cost: "Vendas o doblones",
    result: "Menos penalizacion.",
    state: "Camillas llenas",
  },
  {
    href: "/missions",
    label: "Camino de campana",
    icon: "missions",
    x: "42%",
    y: "30%",
    note: "Salir de la ciudad hacia barro y botin.",
    cost: "Fatiga alta",
    result: "Botin e informes.",
    state: "Estandarte listo",
  },
  {
    href: "/inventory",
    label: "Petate",
    icon: "inventory",
    x: "66%",
    y: "30%",
    note: "Botin, pan, vendas y pertrechos.",
    cost: "Sin coste",
    result: "Petate ordenado.",
    state: "Mesa ocupada",
  },
  {
    href: "/equipment",
    label: "Equipo",
    icon: "equipment",
    x: "37%",
    y: "73%",
    note: "Ranuras activas y bonos de combate.",
    cost: "Sin coste",
    result: "Bonos activos.",
    state: "Correas tensas",
  },
] as const;

export default function CityPage() {
  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="city" label="Ciudad" className="h-9 w-9" />
            <div>
              <h1 className="font-cinzel text-2xl font-extrabold uppercase text-gold md:text-3xl">La Ciudad</h1>
              <p className="text-sm text-text-muted">Plaza de paga, hierro y barro.</p>
            </div>
          </div>
          <div className="border border-gold/25 bg-background/70 px-3 py-1 font-mono text-xs uppercase text-gold-soft">
            Hub principal
          </div>
        </header>

        <section className="game-panel overflow-hidden p-3">
          <div className="scene-frame relative min-h-[560px] overflow-hidden rounded-xs bg-stone-950 md:min-h-[620px] xl:min-h-[680px]">
            <Image
              src={featuredAssetPaths.city}
              alt="Plaza de campamento con soldados, oficiales, tiendas y barro"
              fill
              sizes="(min-width: 1280px) 960px, 100vw"
              priority
              className="scene-image-realism absolute inset-0 h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,transparent_0%,rgba(7,6,4,0.18)_45%,rgba(7,6,4,0.76)_100%)]" />
            <div className="absolute inset-x-0 top-0 bg-linear-to-b from-background/85 via-background/30 to-transparent p-4 md:p-5">
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
                className="group absolute z-10 hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center outline-hidden md:flex"
              >
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/45 bg-background/90 shadow-[0_12px_24px_rgba(0,0,0,0.55)] transition group-hover:-translate-y-1 group-hover:border-gold group-hover:bg-panel-raised group-focus-visible:border-gold md:h-20 md:w-20">
                  <span className="absolute -inset-2 rounded-full border border-gold/15 bg-black/10 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                  <UiAssetIcon id={spot.icon} label={spot.label} className="h-11 w-11 md:h-14 md:w-14" />
                </span>
                <span className="max-w-[9.5rem] border border-iron/70 bg-stone-950/88 px-2 py-1 font-cinzel text-[13px] font-bold uppercase leading-tight text-gold-soft shadow-lg transition group-hover:border-gold/60 group-hover:text-gold">
                  {spot.label}
                </span>
                <span className="pointer-events-none absolute top-full mt-2 hidden w-64 border border-gold/35 bg-stone-950/96 p-3 text-left shadow-xl group-hover:block group-focus-visible:block">
                  <span className="block font-mono text-[11px] uppercase text-gold-soft">{spot.state}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-text-muted">{spot.note}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
