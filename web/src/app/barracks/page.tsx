"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { useGameStore } from "@/lib/game-store";
import { featuredAssetPaths, getItem, getItemImagePath, getRankName, getWound } from "@/lib/game-data";

const statLabels: Record<string, string> = {
  pike: "Pica",
  sword: "Espada",
  arquebus: "Arcabuz",
  discipline: "Disciplina",
  vigor: "Vigor",
  cunning: "Astucia",
  command: "Mando",
};

const slotLabels: Record<string, string> = {
  head: "Cabeza",
  body: "Cuerpo",
  mainHand: "Arma",
  offHand: "Apoyo",
  firearm: "Arcabuz",
  accessory: "Reliquia",
  boots: "Botas",
  consumable: "Uso",
};

export default function BarracksPage() {
  const { soldier, reports } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="py-12 text-center font-cinzel text-xl text-gold animate-pulse">Cargando cuartel...</div>;
  }

  const latestReport = reports[0];

  return (
    <PageTransition>
      <div className="space-y-6">
        <section className="visual-hero scene-frame relative overflow-hidden rounded-sm">
          <img
            src={featuredAssetPaths.barracks}
            alt="Cuartel de campana"
            className="scene-image-realism absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/62 to-background/12" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-transparent to-transparent" />
          <div className="relative z-10 flex min-h-[270px] flex-col justify-between p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <UiAssetIcon id="barracks" label="Cuartel" className="h-20 w-20 md:h-24 md:w-24" />
              <Badge variant="gold">Campana Activa</Badge>
            </div>
            <div>
              <h1 className="visual-hero-title font-blackletter font-extrabold tracking-wide text-gold drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
                El Cuartel
              </h1>
              <p className="mt-3 max-w-2xl font-cinzel text-xl font-bold uppercase tracking-[0.12em] text-gold-soft md:text-2xl">
                Descanso, paga, heridas y nuevas ordenes.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card title={soldier.name} iconId="soldier">
              <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                <div className="scene-frame relative h-80 overflow-hidden rounded-xs border border-iron">
                  <img
                    src={featuredAssetPaths.diegoPortrait}
                    alt={soldier.name}
                    className="portrait-realism h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="space-y-5">
                  <div>
                    <h2 className="font-cinzel text-4xl font-bold text-text">{soldier.name}</h2>
                    <p className="mt-1 font-mono text-lg uppercase tracking-wider text-gold-soft">
                      {getRankName(soldier.rank)} / Infanteria de Linea
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <ProfileTile icon="missions" label="Origen" value="Toledo" />
                    <ProfileTile icon="rank" label="Edad" value="28 anos" />
                    <ProfileTile icon="coins" label="Soldada" value="6 sueldos" />
                    <ProfileTile icon="info" label="Filiacion" value="1620" />
                  </div>

                  <p className="border-l-4 border-gold/45 bg-background/40 p-4 font-serif text-xl italic leading-relaxed text-text-muted">
                    Pica firme. Botas mojadas. Paga tarde.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Habilidades" iconId="training">
                <div className="space-y-4 font-mono">
                  {Object.entries(soldier.stats).map(([stat, value]) => (
                    <div key={stat} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-cinzel text-lg font-bold text-text-muted">{statLabels[stat] || stat}</span>
                        <span className="text-2xl font-bold text-gold-soft">{value}</span>
                      </div>
                      <div className="stat-bar rounded-xs">
                        <div
                          className="stat-bar-fill-gold transition-all duration-300"
                          style={{ width: `${Math.min(100, (value / 80) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Equipo" iconId="equipment">
                <div className="space-y-3 font-mono">
                  {Object.entries(soldier.equipment).map(([slot, itemId]) => {
                    const item = itemId ? getItem(itemId) : null;
                    return (
                      <div key={slot} className="flex items-center justify-between gap-3 border-b border-iron pb-2 last:border-0">
                        <span className="font-cinzel text-base font-bold text-text-muted">{slotLabels[slot] || slot}</span>
                        {item ? (
                          <span className="flex max-w-[70%] items-center justify-end gap-3 border border-iron bg-panel-soft px-3 py-1 text-right font-sans text-base font-medium text-gold">
                            <img
                              src={getItemImagePath(item.id)}
                              alt=""
                              className="h-10 w-10 shrink-0 object-contain"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                            <span className="truncate">{item.name}</span>
                          </span>
                        ) : (
                          <span className="font-sans text-base italic text-muted">Vacio</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {latestReport ? (
              <Card title="Ultimo Informe" iconId="info">
                <div className="parchment-card p-5 shadow-inner">
                  <div className="mb-3 flex items-center gap-3 border-b border-parchment-dark/30 pb-3 font-serif text-base text-stone-850">
                    <UiAssetIcon id="info" label="Informe" className="h-9 w-9" />
                    <span className="font-bold uppercase tracking-wider">Informe de Mision</span>
                    <span className="ml-auto font-mono text-sm">
                      {latestReport.success ? (
                        <span className="border border-success/30 bg-success/15 px-2 py-1 font-bold uppercase text-success">Exito</span>
                      ) : (
                        <span className="border border-danger/30 bg-danger/15 px-2 py-1 font-bold uppercase text-danger">Derrota</span>
                      )}
                    </span>
                  </div>
                  <p className="report-text whitespace-pre-line text-stone-800 line-clamp-4">{latestReport.report}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-parchment-dark/30 pt-3">
                    <div className="flex flex-wrap gap-2 font-mono text-base font-bold text-stone-700">
                      <Reward icon="coins" label={`+${latestReport.rewards.coins}`} />
                      <Reward icon="xp" label={`+${latestReport.rewards.xp} XP`} />
                      <Reward icon="honor" label={`+${latestReport.rewards.honor}`} />
                    </div>
                    <Link className="flex items-center gap-2 font-serif text-lg font-bold text-blood hover:text-blood-bright" href={`/reports/${latestReport.id}`}>
                      <UiAssetIcon id="info" label="Leer informe" className="h-7 w-7" />
                      Leer
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              <Card title="Ultimo Informe" iconId="info">
                <div className="border border-dashed border-iron p-6 text-center text-lg text-muted">
                  <p>Sin misiones recientes.</p>
                  <Link href="/missions" className="mt-3 inline-flex items-center gap-2 text-gold hover:underline">
                    <UiAssetIcon id="missions" label="Misiones" className="h-8 w-8" />
                    Ir a misiones
                  </Link>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card title="Estado" iconId="hospital">
              <div className="space-y-5">
                <div className="asset-icon-frame relative h-36 overflow-hidden rounded-xs border border-iron bg-stone-950">
                  <img
                    src={featuredAssetPaths.diegoSpriteWalk}
                    alt="Diego de Arce en marcha"
                    className="h-full w-full object-contain p-3"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-lg">
                    <span className="flex items-center gap-3">
                      <UiAssetIcon id="fatigue" label="Fatiga" className="h-9 w-9" />
                      Fatiga
                    </span>
                    <span className={soldier.fatigue > 70 ? "font-bold text-danger" : "text-text"}>{soldier.fatigue} / 100</span>
                  </div>
                  <div className="stat-bar rounded-xs">
                    <div className={`h-full transition-all duration-300 ${soldier.fatigue > 70 ? "bg-danger" : "bg-ember"}`} style={{ width: `${soldier.fatigue}%` }} />
                  </div>
                </div>

                <div className="space-y-2 border-t border-iron pt-4">
                  <div className="flex items-center gap-3 font-mono text-lg">
                    <UiAssetIcon id="hospital" label="Heridas" className="h-9 w-9" />
                    Heridas
                  </div>
                  {soldier.wounds.length === 0 ? (
                    <p className="border border-iron/50 bg-stone-900/40 p-3 text-lg italic text-text-muted">Sin heridas.</p>
                  ) : (
                    <div className="space-y-2">
                      {soldier.wounds.map((active) => {
                        const wound = getWound(active.woundId);
                        return (
                          <div key={active.id} className="flex items-center justify-between border border-iron bg-background/50 p-3 text-base">
                            <span className="font-semibold text-text">{wound?.name ?? active.woundId}</span>
                            <span className={`font-mono font-bold uppercase ${active.treated ? "text-success" : "text-danger"}`}>
                              {active.treated ? "Vendado" : "Abierta"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-iron pt-4">
                  <ProfileTile icon="coins" label="Atraso" value={`${soldier.unpaidWages}`} danger={soldier.unpaidWages > 0} />
                  <ProfileTile icon="coins" label="Paga" value="6" />
                </div>
              </div>
            </Card>

            <Card title="Ordenes" iconId="missions">
              <div className="grid gap-3">
                <ActionLink href="/training" icon="training" label="Entrenar" />
                <ActionLink href="/inventory" icon="inventory" label="Inventario" />
                <ActionLink href="/armory" icon="armory" label="Armeria" />
                <ActionLink href="/hospital" icon="hospital" label="Hospital" />
                <ActionLink href="/missions" icon="missions" label="Mision" danger />
              </div>
            </Card>

            <div className="game-panel border border-iron p-5 text-center">
              <p className="font-serif text-2xl italic leading-snug text-text-muted">
                Espana mi natura, Italia mi ventura, Flandes mi sepultura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function ProfileTile({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ComponentProps<typeof UiAssetIcon>["id"];
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="icon-stat-tile flex min-h-28 flex-col items-start justify-center gap-2 p-3">
      <UiAssetIcon id={icon} label={label} className="h-12 w-12" />
      <div className="min-w-0">
        <p className="text-sm uppercase text-muted">{label}</p>
        <p className={`font-cinzel text-2xl font-bold leading-tight ${danger ? "text-danger" : "text-text"}`}>{value}</p>
      </div>
    </div>
  );
}

function Reward({ icon, label }: { icon: React.ComponentProps<typeof UiAssetIcon>["id"]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 border border-stone-500/30 bg-stone-900/10 px-2 py-1">
      <UiAssetIcon id={icon} label={label} className="h-6 w-6" />
      {label}
    </span>
  );
}

function ActionLink({
  href,
  icon,
  label,
  danger = false,
}: {
  href: string;
  icon: React.ComponentProps<typeof UiAssetIcon>["id"];
  label: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-16 items-center gap-4 border px-4 py-3 font-cinzel text-xl font-bold uppercase tracking-wider transition-all ${
        danger
          ? "border-blood-bright/35 bg-blood/12 text-text hover:bg-blood/22 hover:text-blood-bright"
          : "border-iron text-text hover:border-gold/35 hover:bg-panel-soft hover:text-gold"
      }`}
    >
      <UiAssetIcon id={icon} label={label} className="h-12 w-12" />
      <span>{label}</span>
    </Link>
  );
}
