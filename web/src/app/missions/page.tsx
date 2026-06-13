"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { listAvailableMissions } from "@/lib/game-data";
import { Flag, Trophy, Flame, ShieldAlert, ChevronRight, CloudRain } from "lucide-react";
import { MissionRainyWatchPlaceholder } from "@/components/game/placeholder-art";

import { PageTransition } from "@/components/game/page-transition";

export default function MissionsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando misiones...</div>;
  }

  const missions = listAvailableMissions();

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-iron pb-3">
        <div>
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">MISIONES Y CAMPAÑAS</h1>
          <p className="text-xs text-text-muted">Despliega a tu soldado en patrullas, asaltos y escoltas por el territorio de Flandes</p>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left: Mission List */}
        <div className="space-y-4">
          <Card title="Patrullas Disponibles">
            <div className="space-y-4">
              {missions.map((mission) => {
                const diffLabels = ["Fácil", "Moderado", "Complicado", "Peligroso", "Suicida"];
                const diffColor = ["text-success", "text-warning", "text-warning", "text-danger", "text-danger"];
                const diffText = diffLabels[mission.difficulty - 1] ?? "Extremo";
                const diffClr = diffColor[mission.difficulty - 1] ?? "text-danger";

                return (
                  <div 
                    key={mission.id}
                    className="p-4 bg-stone-900/60 border border-iron hover:border-gold/20 rounded-xs flex flex-col md:flex-row justify-between gap-4 transition-all"
                  >
                    {/* Visual & Description */}
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                      <div className="w-full sm:w-48 h-28 rounded-xs overflow-hidden border border-iron/80 shrink-0 bg-background flex items-center justify-center">
                        <MissionRainyWatchPlaceholder className="w-full h-full" missionId={mission.id} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-cinzel text-base font-bold text-gold-soft uppercase">
                            {mission.title}
                          </h3>
                          <span className={`text-[10px] font-mono font-bold uppercase ${diffClr}`}>
                            [{diffText}]
                          </span>
                        </div>
                        <p className="text-xs text-text-muted font-serif italic mt-1 leading-relaxed max-w-lg">
                          Aventúrate en esta misión bajo el mando del Tercio. Las condiciones meteorológicas y de terreno afectarán el esfuerzo requerido.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono text-text-muted">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-ember" />
                            <span>Fatiga +{mission.fatigue}</span>
                          </span>
                          <span className="flex items-center gap-1 text-danger">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Riesgo Herida: {mission.woundChance}%</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rewards & Action */}
                    <div className="flex flex-row md:flex-col justify-between items-end shrink-0 border-t md:border-t-0 border-iron/50 pt-3 md:pt-0 gap-3">
                      <div className="text-left md:text-right font-mono text-xs">
                        <p className="text-[9px] uppercase text-muted tracking-wider">Recompensas</p>
                        <p className="text-gold font-bold">Doblones: {mission.rewards.coins}</p>
                        <p className="text-text-muted">XP: {mission.rewards.xp} | Honor: {mission.rewards.honor}</p>
                      </div>
                      <Link
                        href={`/missions/${mission.id}`}
                        className="px-4 py-2 bg-blood hover:bg-blood-bright border border-blood-bright text-xs font-mono font-bold uppercase tracking-wider text-text hover:text-white rounded-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Detalles</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Objectives & Campaign Conditions */}
        <div className="space-y-6">
          {/* Objectives Card */}
          <Card title="Condiciones de la Campaña">
            <div className="space-y-4 font-sans text-xs text-text-muted leading-relaxed">
              <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-2">
                <div className="flex items-center gap-1.5 text-gold font-mono font-bold uppercase text-[10px] tracking-wider">
                  <CloudRain className="w-4 h-4 text-amber" />
                  <span>Clima: Lluvia Incesante</span>
                </div>
                <p>
                  El invierno en los Países Bajos ha enfangado los caminos. La fatiga física sufrida en todas las marchas y patrullas aumenta en un <strong>+5%</strong>.
                </p>
              </div>

              <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-2">
                <div className="flex items-center gap-1.5 text-gold font-mono font-bold uppercase text-[10px] tracking-wider">
                  <Flag className="w-4 h-4 text-blood-bright" />
                  <span>Campaña: Flandes 1620</span>
                </div>
                <p>
                  Asegurar los pasos y escoltar suministros de pólvora es crítico para levantar el sitio a la fortaleza enemiga.
                </p>
              </div>
            </div>
          </Card>

          {/* Historical quote */}
          <div className="game-panel p-4 text-center border border-iron bg-linear-to-b from-stone-900 to-stone-950 rounded-xs">
            <p className="font-serif italic text-xs text-text-muted leading-relaxed">
              "Si los franceses tienen picas de roble, los españoles las tienen de pino, pero el coraje es el que las empuña."
            </p>
            <p className="text-[10px] uppercase font-mono text-gold-soft/50 tracking-wider mt-2">
              — Crónicas de Campaña
            </p>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
