"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { featuredAssetPaths, listAvailableMissions, getMissionSceneImagePath } from "@/lib/game-data";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { PageTransition } from "@/components/game/page-transition";
import { 
  Castle, 
  Route, 
  Shield, 
  Flame, 
  Swords, 
  Compass, 
  MapPin, 
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import type { MissionDefinition } from "@/lib/types";

// Helper to determine the Lucide icon for each location type
function getIconForLocation(type: string) {
  switch (type) {
    case "city":
      return Castle;
    case "fortress":
      return Shield;
    case "road":
      return Route;
    case "skirmish":
      return Flame;
    case "battle":
      return Swords;
    default:
      return MapPin;
  }
}

// Helper to map location types to user-friendly Spanish terms
function getLocationLabel(type: string): string {
  switch (type) {
    case "city":
      return "Ciudad / Población";
    case "fortress":
      return "Fortaleza / Baluarte";
    case "road":
      return "Camino de Campaña";
    case "skirmish":
      return "Escaramuza (Chusta)";
    case "battle":
      return "Batalla de Primera Línea";
    default:
      return "Zona de Operación";
  }
}

export default function MissionsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissionDefinition | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando mapa de campaña...</div>;
  }

  const missions = listAvailableMissions();

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center border-b border-iron pb-3">
          <div>
            <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">MAPA DE CAMPAÑA</h1>
            <p className="text-xs text-text-muted">Despliega tu tropa y asegura las posiciones estratégicas en el frente de Flandes</p>
          </div>
        </div>

        {/* Interactive Map & Details Layout */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Column 1: Campaign Map */}
          <div className="space-y-4">
            <div className="game-panel p-2 rounded-xs border border-iron bg-stone-950/80 shadow-inner">
              <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xs bg-[radial-gradient(ellipse_at_center,_rgba(45,35,25,0.4)_0%,_#0c0a09_100%)] shadow-2xl">
                {/* Generated Campaign Map Image */}
                <img
                  src={featuredAssetPaths.campaignMap}
                  alt="Flanders Campaign Map"
                  className="w-full h-full object-cover opacity-75 select-none pointer-events-none transition-opacity duration-700"
                />

                {/* Map Vignette & Overlay */}
                <div className="absolute inset-0 bg-radial-[circle_at_center,_rgba(0,0,0,0)_50%,_rgba(0,0,0,0.65)_100%] pointer-events-none mix-blend-multiply" />
                <div className="absolute inset-0 bg-amber-950/5 pointer-events-none mix-blend-color" />

                {/* Grid Overlay for Cartographic Look */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-10 pointer-events-none">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border-r border-b border-amber-950/60" />
                  ))}
                </div>

                {/* Compass Rose Decoration */}
                <div className="absolute top-4 right-4 w-16 h-16 md:w-20 md:h-20 opacity-30 text-gold pointer-events-none animate-[spin_120s_linear_infinite]">
                  <Compass className="w-full h-full stroke-1" />
                </div>

                {/* Interactive Map Nodes */}
                {missions.map((mission) => {
                  const isSelected = selectedMission?.id === mission.id;
                  const Icon = getIconForLocation(mission.locationType);
                  const diffColors = ["border-success text-success bg-success/10", "border-warning text-warning bg-warning/10", "border-warning text-warning bg-warning/10", "border-danger text-danger bg-danger/10", "border-danger text-danger bg-danger/10"];
                  const difficultyColor = diffColors[mission.difficulty - 1] || "border-danger text-danger bg-danger/10";

                  return (
                    <button
                      key={mission.id}
                      onClick={() => setSelectedMission(mission)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 focus:outline-hidden group"
                      style={{ left: `${mission.x}%`, top: `${mission.y}%` }}
                    >
                      {/* Pulse Ring Indicator */}
                      <span className={`absolute -inset-2.5 rounded-full border border-gold-soft/50 opacity-0 transition-all duration-500 ${
                        isSelected 
                          ? "animate-ping opacity-100 scale-110" 
                          : "group-hover:animate-pulse group-hover:opacity-75"
                      }`} />

                      {/* Map Pin (Wax Seal Style) */}
                      <div className={`h-11 w-11 md:h-13 md:w-13 rounded-full border-2 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                        isSelected
                          ? "bg-blood border-gold text-gold scale-115 shadow-[0_0_15px_rgba(201,162,79,0.7)]"
                          : "bg-stone-900/95 border-iron text-gold-soft hover:bg-stone-850 hover:border-gold hover:text-gold hover:scale-105 hover:shadow-[0_0_10px_rgba(201,162,79,0.3)]"
                      }`}>
                        <Icon className="h-5.5 w-5.5 md:h-6.5 md:w-6.5 transition-transform duration-300 group-hover:scale-110" />
                      </div>

                      {/* Floating Text Label */}
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-xs border text-[9px] md:text-[10px] font-mono tracking-wider transition-all duration-200 pointer-events-none whitespace-nowrap shadow-md ${
                        isSelected
                          ? "bg-stone-950 border-gold text-gold opacity-100 font-bold"
                          : "bg-stone-900/90 border-iron/60 text-text-muted opacity-80 group-hover:opacity-100 group-hover:border-iron group-hover:text-text"
                      }`}>
                        <span className="flex items-center gap-1.5">
                          {mission.title}
                          <span className={`px-1 text-[8px] border rounded-xs font-sans ${difficultyColor}`}>
                            N. {mission.difficulty}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Selected Mission Details OR Campaign Conditions */}
          <div className="space-y-6">
            {selectedMission ? (
              // Display Detailed Briefing for Selected Mission
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Card 
                  title="ORDEN DE CAMPAÑA" 
                  iconId="missions"
                >
                  <div className="space-y-5 font-sans">
                    {/* Header Details */}
                    <div className="flex justify-between items-start border-b border-iron/40 pb-3 gap-2">
                      <div>
                        <h3 className="font-cinzel text-lg font-bold text-gold uppercase leading-snug">
                          {selectedMission.title}
                        </h3>
                        <p className="text-[10px] font-mono text-gold-soft uppercase tracking-widest mt-1">
                          {getLocationLabel(selectedMission.locationType)}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedMission(null)}
                        className="text-text-muted hover:text-gold flex items-center gap-1 text-[10px] font-mono border border-iron/50 hover:border-gold/30 px-2 py-0.5 rounded-xs transition-colors cursor-pointer shrink-0"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Volver</span>
                      </button>
                    </div>

                    {/* Mission Scene Illustration */}
                    <div className="relative h-36 rounded-xs overflow-hidden border border-iron/60 bg-stone-950">
                      <img
                        src={getMissionSceneImagePath(selectedMission.id)}
                        alt={selectedMission.title}
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-gold-soft uppercase tracking-wider">
                        Teatro de Operación
                      </div>
                    </div>

                    {/* Briefing Text */}
                    <div className="p-3 bg-stone-900/40 border border-iron/40 rounded-xs">
                      <h4 className="text-[10px] uppercase font-mono tracking-wider text-text-muted mb-1.5">Informe de Situación:</h4>
                      <p className="text-xs text-text-muted font-serif italic leading-relaxed">
                        {selectedMission.id === "night_watch_rain" && "La llovizna fría empaña la visión en los puestos de avanzada. Debes relevar la guardia y mantener los oídos abiertos para detectar movimientos hostiles en las sombras del campamento."}
                        {selectedMission.id === "muddy_road_patrol" && "Los caminos de Flandes se han convertido en ciénagas de barro. Patrulla los caminos comerciales de la compañía para escoltar convoyes mercantes y ahuyentar alimañas."}
                        {selectedMission.id === "crossroads_skirmish" && "Una patrulla enemiga de avanzada ha cortado el paso estratégico en el cruce de caminos. Dispérsalos de inmediato utilizando el fuego de tus arcabuces antes de que se refuercen."}
                        {selectedMission.id === "powder_escort_front" && "Pertrechos clave de pólvora negra deben alcanzar las líneas del asedio. Los caminos están acosados por escaramuzadores franceses decididos a sabotear los suministros."}
                        {selectedMission.id === "bastion_assault" && "Sargento Mayor convoca a un asalto audaz sobre el baluarte exterior enemigo. Una batalla feroz aguarda en las murallas; la pica y el acero decidirán la victoria hoy."}
                      </p>
                    </div>

                    {/* Stats & Costs */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 bg-stone-900/60 border border-iron/50 rounded-xs space-y-1">
                        <span className="text-[9px] uppercase text-muted block">Esfuerzo</span>
                        <span className="font-sans font-bold text-ember">+{selectedMission.fatigue} Fatiga</span>
                      </div>
                      <div className="p-2.5 bg-stone-900/60 border border-iron/50 rounded-xs space-y-1">
                        <span className="text-[9px] uppercase text-muted block">Riesgo Herida</span>
                        <span className="font-sans font-bold text-danger">{selectedMission.woundChance}% Prob.</span>
                      </div>
                    </div>

                    {/* Rewards Summary */}
                    <div className="space-y-2 border-t border-iron/40 pt-3">
                      <h4 className="text-[10px] uppercase font-mono tracking-widest text-muted">Recompensas en caso de Éxito:</h4>
                      <div className="p-3 bg-stone-900/80 border border-iron/60 rounded-xs space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-gold">
                          <span className="flex items-center gap-1.5">
                            <UiAssetIcon id="coins" label="Oro" className="h-5 w-5" />
                            <span>Doblones de paga:</span>
                          </span>
                          <span className="font-bold">+{selectedMission.rewards.coins}</span>
                        </div>
                        <div className="flex justify-between text-text">
                          <span className="flex items-center gap-1.5">
                            <UiAssetIcon id="xp" label="XP" className="h-5 w-5" />
                            <span>Experiencia (XP):</span>
                          </span>
                          <span className="font-bold">+{selectedMission.rewards.xp} XP</span>
                        </div>
                        <div className="flex justify-between text-amber">
                          <span className="flex items-center gap-1.5">
                            <UiAssetIcon id="honor" label="Honor" className="h-5 w-5" />
                            <span>Honor Militar:</span>
                          </span>
                          <span className="font-bold">+{selectedMission.rewards.honor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dispatch Link */}
                    <Link
                      href={`/missions/${selectedMission.id}`}
                      className="w-full py-3 bg-blood hover:bg-blood-bright border border-blood-bright text-xs font-mono font-bold uppercase tracking-widest text-text hover:text-white rounded-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <span>Inspeccionar y Desplegar</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Card>
              </div>
            ) : (
              // Display Default Campaign Conditions
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card title="Condiciones de la Campaña">
                  <div className="space-y-4 font-sans text-xs text-text-muted leading-relaxed">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { src: featuredAssetPaths.campaignColumn, alt: "Columna del tercio" },
                        { src: featuredAssetPaths.officerSupplies, alt: "Oficiales junto a pertrechos" },
                        { src: featuredAssetPaths.tavernTable, alt: "Soldados en mesa de campaña" },
                      ].map((asset) => (
                        <div key={asset.src} className="asset-icon-frame h-20 overflow-hidden rounded-xs border border-iron bg-stone-950">
                          <img
                            src={asset.src}
                            alt={asset.alt}
                            className="h-full w-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 bg-stone-900/60 border border-iron rounded-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-gold font-mono font-bold uppercase text-xs tracking-wider">
                        <UiAssetIcon id="fatigue" label="Clima" className="h-5 w-5" />
                        <span>Clima: Lluvia Incesante</span>
                      </div>
                      <p>
                        El invierno en los Países Bajos ha enfangado los caminos. La fatiga física sufrida en todas las marchas y patrullas aumenta en un <strong>+5%</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 bg-stone-900/60 border border-iron rounded-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-gold font-mono font-bold uppercase text-xs tracking-wider">
                        <UiAssetIcon id="missions" label="Campana" className="h-5 w-5" />
                        <span>Campaña: Flandes 1620</span>
                      </div>
                      <p>
                        Asegurar los pasos y escoltar suministros de pólvora es crítico para levantar el sitio a la fortaleza enemiga. Selecciona un nodo en el mapa para iniciar.
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
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
