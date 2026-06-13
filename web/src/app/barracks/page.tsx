"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge, SubmitButton } from "@/components/ui/card";
import { getRankName, getWound } from "@/lib/game-data";
import { getItem } from "@/lib/game-data";
import { SoldierPortraitPlaceholder } from "@/components/game/placeholder-art";
import { 
  User, 
  Dumbbell, 
  Backpack, 
  Store, 
  Flag, 
  HeartPulse, 
  Flame, 
  DollarSign, 
  ScrollText, 
  FileText,
  AlertTriangle
} from "lucide-react";

import { PageTransition } from "@/components/game/page-transition";

export default function BarracksPage() {
  const { soldier, reports } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando cuartel...</div>;
  }

  const latestReport = reports[0];

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-center border-b border-iron pb-3">
        <div>
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">EL CUARTEL</h1>
          <p className="text-xs text-text-muted">Centro de mando y descanso del Tercio</p>
        </div>
        <Badge variant="gold">Estado: Campaña Activa</Badge>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left Column: Soldier details and progress */}
        <div className="space-y-6">
          {/* Soldier Profile Panel */}
          <Card title="Perfil del Soldado">
            <div className="grid gap-6 md:grid-cols-[240px_1fr]">
              {/* Portrait */}
              <div className="w-full h-72 rounded-xs overflow-hidden shadow-lg border border-iron">
                <SoldierPortraitPlaceholder className="w-full h-full" />
              </div>

              {/* Bio & Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-cinzel text-2xl font-bold text-text">{soldier.name}</h3>
                  <p className="text-sm font-mono text-gold-soft uppercase tracking-wider">
                    {getRankName(soldier.rank)} · Infantería de Línea
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-text-muted">
                  <div className="border-l border-iron pl-3">
                    <p className="uppercase text-[10px] text-muted">Origen</p>
                    <p className="text-text font-sans">Toledo, Castilla</p>
                  </div>
                  <div className="border-l border-iron pl-3">
                    <p className="uppercase text-[10px] text-muted">Edad</p>
                    <p className="text-text font-sans">28 Años</p>
                  </div>
                  <div className="border-l border-iron pl-3">
                    <p className="uppercase text-[10px] text-muted">Soldada / Sueldo</p>
                    <p className="text-text font-sans">6 sueldos / mes</p>
                  </div>
                  <div className="border-l border-iron pl-3">
                    <p className="uppercase text-[10px] text-muted">Filiación</p>
                    <p className="text-text font-sans">12 de marzo de 1620</p>
                  </div>
                </div>

                <p className="text-xs font-serif italic text-text-muted leading-relaxed">
                  "Un veterano bisoño de Toledo. Ha marchado por el camino español y ha probado el barro de Flandes. 
                  Lucha con la pica y el alma, a la espera de que la paga de Su Majestad llegue antes que el frío."
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Core Stats */}
            <Card title="Habilidades del Soldado">
              <div className="space-y-3 text-xs font-mono">
                {Object.entries(soldier.stats).map(([stat, value]) => {
                  const statLabels: Record<string, string> = {
                    pike: "Pica (Pike)",
                    sword: "Espada (Sword)",
                    arquebus: "Arcabuz (Arquebus)",
                    discipline: "Disciplina (Discipline)",
                    vigor: "Vigor",
                    cunning: "Astucia (Cunning)",
                    command: "Mando (Command)",
                  };
                  return (
                    <div key={stat} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-muted font-sans capitalize">{statLabels[stat] || stat}</span>
                        <span className="font-bold text-gold-soft">{value}</span>
                      </div>
                      <div className="stat-bar rounded-xs">
                        <div 
                          className="stat-bar-fill-gold transition-all duration-300"
                          style={{ width: `${Math.min(100, (value / 80) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Quick Equipment List */}
            <Card title="Equipo Equipado">
              <div className="space-y-2 text-xs font-mono">
                {Object.entries(soldier.equipment).map(([slot, itemId]) => {
                  const slotLabels: Record<string, string> = {
                    head: "Cabeza (Morrión)",
                    body: "Cuerpo (Coraza/Jubón)",
                    mainHand: "Arma Principal",
                    offHand: "Escudo/Daga",
                    firearm: "Arcabuz",
                    accessory: "Accesorio",
                    boots: "Calzado",
                    consumable: "Consumible",
                  };
                  const item = itemId ? getItem(itemId) : null;
                  return (
                    <div key={slot} className="flex justify-between items-center border-b border-iron pb-1.5 last:border-0">
                      <span className="text-text-muted font-sans text-xs">{slotLabels[slot] || slot}</span>
                      {item ? (
                        <span className="text-gold font-sans font-medium text-xs bg-panel-soft px-2 py-0.5 border border-iron rounded-xs">
                          {item.name}
                        </span>
                      ) : (
                        <span className="text-muted italic text-[11px] font-sans">- Vacío -</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Latest Report Preview */}
          {latestReport ? (
            <Card title="Último Informe de Campaña">
              <div className="parchment-card p-4 rounded-xs border border-parchment-dark/40 shadow-inner">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-parchment-dark/30 text-stone-850 font-serif text-sm">
                  <ScrollText className="w-4 h-4 text-stone-700" />
                  <span className="font-bold uppercase tracking-wider">Informe de Misión</span>
                  <span className="ml-auto font-mono text-xs">
                    {latestReport.success ? (
                      <span className="text-success bg-success/15 border border-success/30 px-1.5 py-0.5 font-bold uppercase rounded-xs">
                        ÉXITO
                      </span>
                    ) : (
                      <span className="text-danger bg-danger/15 border border-danger/30 px-1.5 py-0.5 font-bold uppercase rounded-xs">
                        DERROTA
                      </span>
                    )}
                  </span>
                </div>
                <p className="whitespace-pre-line text-stone-800 report-text leading-relaxed italic text-sm md:text-base">
                  "{latestReport.report}"
                </p>
                <div className="mt-4 pt-2 border-t border-parchment-dark/30 flex justify-between items-center">
                  <div className="flex gap-3 text-[11px] font-mono text-stone-700 font-semibold">
                    <span>Doblones +{latestReport.rewards.coins}</span>
                    <span>XP +{latestReport.rewards.xp}</span>
                    <span>Honor +{latestReport.rewards.honor}</span>
                  </div>
                  <Link 
                    className="text-xs font-serif font-bold text-blood hover:text-blood-bright underline decoration-blood flex items-center gap-1"
                    href={`/reports/${latestReport.id}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Leer informe completo</span>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <Card title="Último Informe de Campaña">
              <div className="border border-dashed border-iron p-6 text-center text-xs text-muted">
                <p>No se han registrado misiones recientes en esta campaña.</p>
                <Link href="/missions" className="text-gold hover:underline mt-2 inline-block">
                  Selecciona una misión para empezar.
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Status & Navigation actions */}
        <div className="space-y-6">
          {/* Barracks Illustration */}
          <div className="relative w-full h-64 rounded-md overflow-hidden border border-iron bg-background shadow-md">
            <img
              src="/assets/generated/scenes/barracks_v01.png"
              alt="Cuartel de Campaña"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-3 font-cinzel text-xs text-gold uppercase tracking-wider">
              Alojamiento
            </div>
          </div>

          {/* Status & Vitals Card */}
          <Card title="Estado Físico">
            <div className="space-y-4">
              {/* Fatigue meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-ember" />
                    <span>Nivel de Fatiga</span>
                  </span>
                  <span className={soldier.fatigue > 70 ? "text-danger font-bold" : "text-text"}>
                    {soldier.fatigue} / 100
                  </span>
                </div>
                <div className="stat-bar rounded-xs">
                  <div 
                    className={`h-full transition-all duration-300 ${soldier.fatigue > 70 ? "bg-danger" : "bg-ember"}`}
                    style={{ width: `${soldier.fatigue}%` }}
                  />
                </div>
                {soldier.fatigue > 70 && (
                  <p className="text-[10px] text-danger font-mono flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>La fatiga alta reduce el poder de combate.</span>
                  </p>
                )}
              </div>

              {/* Active Wounds list */}
              <div className="space-y-2 border-t border-iron pt-3">
                <div className="flex items-center gap-1 text-xs font-mono">
                  <HeartPulse className="w-3.5 h-3.5 text-blood-bright" />
                  <span>Heridas Activas</span>
                </div>
                
                {soldier.wounds.length === 0 ? (
                  <p className="text-xs text-text-muted italic bg-stone-900/40 p-2 rounded-xs border border-iron/50">
                    Sin heridas. Diego está en plenas facultades.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {soldier.wounds.map((active) => {
                      const wound = getWound(active.woundId);
                      return (
                        <div 
                          key={active.id} 
                          className="flex justify-between items-center text-xs p-2 bg-background/50 border border-iron rounded-xs"
                        >
                          <div>
                            <span className="font-semibold text-text">{wound?.name ?? active.woundId}</span>
                            {!active.treated && (
                              <span className="block text-[9px] text-danger font-mono uppercase">Abierta (-2 Combate)</span>
                            )}
                          </div>
                          {active.treated ? (
                            <span className="text-[10px] font-mono text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded-xs uppercase">
                              Vendada
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-danger bg-danger/10 border border-danger/30 px-1.5 py-0.5 rounded-xs uppercase animate-pulse">
                              Sangrando
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Wages & Finances */}
              <div className="space-y-2 border-t border-iron pt-3 text-xs font-mono">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-gold" />
                  <span>Finanzas de la Soldada</span>
                </div>
                <div className="bg-stone-900/60 p-2 border border-iron rounded-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Atraso de Sueldos:</span>
                    <span className={`font-bold ${soldier.unpaidWages > 0 ? "text-danger" : "text-success"}`}>
                      {soldier.unpaidWages} sueldos
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Paga base mes:</span>
                    <span className="text-text">6 sueldos</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions Panel */}
          <Card title="Órdenes de Cuartel">
            <div className="grid grid-cols-1 gap-2.5">
              <Link 
                href="/training" 
                className="flex items-center gap-3 px-3 py-2 border border-iron hover:border-gold/30 hover:bg-panel-soft text-xs text-text hover:text-gold uppercase tracking-wider font-mono transition-all rounded-xs"
              >
                <Dumbbell className="w-4 h-4 text-gold/60" />
                <span>Entrenar Habilidades</span>
              </Link>
              
              <Link 
                href="/inventory" 
                className="flex items-center gap-3 px-3 py-2 border border-iron hover:border-gold/30 hover:bg-panel-soft text-xs text-text hover:text-gold uppercase tracking-wider font-mono transition-all rounded-xs"
              >
                <Backpack className="w-4 h-4 text-gold/60" />
                <span>Equipar & Inventario</span>
              </Link>

              <Link 
                href="/armory" 
                className="flex items-center gap-3 px-3 py-2 border border-iron hover:border-gold/30 hover:bg-panel-soft text-xs text-text hover:text-gold uppercase tracking-wider font-mono transition-all rounded-xs"
              >
                <Store className="w-4 h-4 text-gold/60" />
                <span>Armería del Tercio</span>
              </Link>

              <Link 
                href="/hospital" 
                className="flex items-center gap-3 px-3 py-2 border border-iron hover:border-gold/30 hover:bg-panel-soft text-xs text-text hover:text-gold uppercase tracking-wider font-mono transition-all rounded-xs"
              >
                <HeartPulse className="w-4 h-4 text-gold/60" />
                <span>Tratar en Hospital</span>
              </Link>

              <Link 
                href="/missions" 
                className="flex items-center gap-3 px-3 py-2 border border-blood-bright/35 bg-blood/10 hover:bg-blood/20 text-xs text-text hover:text-blood-bright uppercase tracking-wider font-mono transition-all rounded-xs mt-2"
              >
                <Flag className="w-4 h-4 text-blood-bright" />
                <span>Iniciar Campaña / Misión</span>
              </Link>
            </div>
          </Card>

          {/* Historical Quote Card */}
          <div className="game-panel p-4 text-center border border-iron bg-linear-to-b from-stone-900 to-stone-950 rounded-xs">
            <p className="font-serif italic text-xs text-text-muted leading-relaxed">
              "España mi natura, Italia mi ventura, Flandes mi sepultura."
            </p>
            <p className="text-[10px] uppercase font-mono text-gold-soft/50 tracking-wider mt-2">
              — Dicho popular de los Tercios
            </p>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
