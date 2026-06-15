"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { getAsset, getAssetPublicPath, getMission, getMissionSceneImagePath, getEquipmentBonuses, enemyDefinitions, getItem } from "@/lib/game-data";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { playDrumSound, playCoinSound } from "@/lib/sounds";
import { PageTransition } from "@/components/game/page-transition";
import { MissionCanvasResolver } from "@/components/game/MissionCanvasResolver";

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { soldier, startMission, activeEvent, resolveActiveEventChoice } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando detalles de misión...</div>;
  }

  // If there is an active event, show the decision screen
  if (activeEvent) {
    const eventAsset = activeEvent.assetId ? getAsset(activeEvent.assetId) : undefined;
    const eventImagePath = eventAsset ? getAssetPublicPath(eventAsset) : undefined;
    const shouldBlurEvent = activeEvent.presentation === "blurred";
    const eventImageFit = eventAsset?.transparent ? "object-contain p-3" : "object-cover";

    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto space-y-6 relative">
          {resolving && (
            <div className="fixed inset-0 bg-background/90 z-50 flex flex-col items-center justify-center p-4">
              <div className="max-w-md w-full text-center p-6 md:p-8 space-y-6 bg-panel border-2 border-iron rounded-sm shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,31,31,0.15)_0%,_transparent_70%)] animate-pulse pointer-events-none" />
                <div className="w-16 h-16 bg-panel-raised border border-gold/30 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <UiAssetIcon id="missions" label="Resolviendo eleccion" className="h-10 w-10 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-cinzel text-xl font-bold text-gold tracking-widest uppercase">
                    Resolviendo Elección
                  </h2>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-blood-bright font-bold">
                    Cruz de Borgoña · Tercio VIII
                  </p>
                </div>
                <p className="font-serif italic text-xs text-text-muted leading-relaxed">
                  "El destino de tu tropa se decide en tu liderazgo. Las consecuencias de tus actos retumban en el campamento..."
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="border-b border-iron pb-3">
            <h1 className="font-cinzel text-2xl font-bold text-gold uppercase tracking-wider">EVENTO DE CAMPAÑA</h1>
            <p className="text-xs text-text-muted">Una situación imprevista requiere tu liderazgo inmediato</p>
          </div>

          <Card title={activeEvent.title}>
            <div className="p-4 space-y-6 font-serif leading-relaxed text-sm md:text-base text-text-muted">
              {eventImagePath && (
                <div className="relative h-56 overflow-hidden rounded-xs border border-iron bg-stone-950">
                  <img
                    src={eventImagePath}
                    alt={activeEvent.mature ? "Escena historica velada" : activeEvent.title}
                    className={`h-full w-full ${eventImageFit} ${shouldBlurEvent ? "blur-md scale-105 opacity-70" : ""}`}
                  />
                  {shouldBlurEvent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/35 px-4 text-center">
                      <span className="border border-gold/30 bg-stone-950/80 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-gold">
                        Escena velada por contenido historico duro
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Event Text */}
              <p className="italic text-text font-medium bg-panel-soft/40 p-4 border-l-2 border-gold rounded-xs">
                "{activeEvent.text}"
              </p>

              {/* Choices List */}
              <div className="space-y-4 pt-4 border-t border-iron/40 font-sans">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-muted">Toma tu decisión:</h4>
                <div className="grid gap-3">
                  {activeEvent.choices.map((choice) => {
                    // Check requirements
                    let canSelect = true;
                    const reqTexts: string[] = [];

                    if (choice.requirements.coins && soldier.coins < choice.requirements.coins) {
                      canSelect = false;
                      reqTexts.push(`${choice.requirements.coins} doblones`);
                    }

                    return (
                      <div
                        key={choice.id}
                        className={`p-3.5 border rounded-xs transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                          canSelect
                            ? "bg-stone-900/60 border-iron hover:border-gold/30 hover:bg-panel-raised"
                            : "bg-stone-950/80 border-iron/30 opacity-60"
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-gold-soft">{choice.label}</p>

                          {!canSelect && (
                            <span className="inline-block text-[9px] font-mono text-danger uppercase bg-danger/10 border border-danger/30 px-1 py-0.5 rounded-xs">
                              Requisitos faltantes: {reqTexts.join(", ")}
                            </span>
                          )}

                          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-text-muted pt-1">
                            {choice.effects.coins !== undefined && (
                              <span className={choice.effects.coins > 0 ? "text-success font-bold" : "text-danger"}>
                                Doblones: {choice.effects.coins > 0 ? `+${choice.effects.coins}` : choice.effects.coins}
                              </span>
                            )}
                            {choice.effects.honor !== undefined && (
                              <span className={choice.effects.honor > 0 ? "text-amber font-bold" : "text-danger"}>
                                Honor: {choice.effects.honor > 0 ? `+${choice.effects.honor}` : choice.effects.honor}
                              </span>
                            )}
                            {choice.effects.fatigue !== undefined && (
                              <span className={choice.effects.fatigue > 0 ? "text-danger" : "text-success font-bold"}>
                                Fatiga: {choice.effects.fatigue > 0 ? `+${choice.effects.fatigue}` : choice.effects.fatigue}
                              </span>
                            )}
                            {choice.effects.reputation !== undefined && (
                              <span className={choice.effects.reputation > 0 ? "text-success font-bold" : "text-danger"}>
                                Reputación: {choice.effects.reputation > 0 ? `+${choice.effects.reputation}` : choice.effects.reputation}
                              </span>
                            )}
                            {choice.effects.corruption !== undefined && (
                              <span className={choice.effects.corruption > 0 ? "text-danger font-bold" : "text-success font-bold"}>
                                Corrupción: {choice.effects.corruption > 0 ? `+${choice.effects.corruption}` : choice.effects.corruption}
                              </span>
                            )}
                            {choice.effects.wound && (
                              <span className="text-danger font-semibold">Riesgo Herida: {choice.effects.wound}</span>
                            )}
                            {choice.effects.breakEquipment && (
                              <span className="text-danger font-semibold">Peligro: Rotura de equipo</span>
                            )}
                            {choice.effects.items && choice.effects.items.map((it) => (
                              <span key={it.itemId} className="text-success font-bold">
                                +{it.quantity} {getItem(it.itemId)?.name || it.itemId}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          disabled={!canSelect}
                          onClick={() => {
                            setResolving(true);
                            playDrumSound();
                            setTimeout(() => {
                              const res = resolveActiveEventChoice(choice.id);
                              if (res.ok && res.reportId) {
                                router.push(`/reports/${res.reportId}`);
                              } else {
                                setResolving(false);
                              }
                            }, 1000);
                          }}
                          className={`w-full md:w-auto px-4 py-1.5 text-[10px] font-mono font-bold uppercase rounded-xs cursor-pointer tracking-wider ${
                            canSelect
                              ? "bg-blood hover:bg-blood-bright border border-blood-bright text-text hover:text-white"
                              : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                          }`}
                        >
                          Elegir
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const id = params.id as string;
  const mission = getMission(id);
  if (!mission) {
    return <div className="text-center py-12 text-xs text-danger font-mono">Misión no encontrada en los registros.</div>;
  }

  // Calculate stats comparison and preview win odds
  const equipmentBonuses = getEquipmentBonuses(soldier.equipment);
  const relevantStat = mission.type.includes("escort") || mission.type.includes("skirmish") 
    ? "arquebus" 
    : mission.type.includes("duel") 
    ? "sword" 
    : mission.type.includes("watch") 
    ? "discipline" 
    : "pike";

  const statLabels: Record<string, string> = {
    pike: "Pica (Pike)",
    sword: "Espada (Sword)",
    arquebus: "Arcabuz (Arquebus)",
    discipline: "Disciplina (Discipline)",
  };

  const basePower =
    soldier.stats[relevantStat] +
    soldier.stats.discipline +
    soldier.stats.vigor +
    Number(equipmentBonuses[relevantStat] ?? 0) +
    Number(equipmentBonuses.discipline ?? 0) +
    Number(equipmentBonuses.vigor ?? 0);
  
  const woundPenalty = soldier.wounds.filter((w) => !w.treated).length * 2;
  const fatiguePenalty = Math.floor(soldier.fatigue / 10);
  const totalPower = basePower - woundPenalty - fatiguePenalty;
  
  const enemyPower = enemyDefinitions.find((e) => e.id === mission.enemyId)?.power ?? 0;
  const targetPower = mission.difficulty * 4 + enemyPower;

  // Odds estimation: roll is 1 to 5
  // success if totalPower + roll >= targetPower
  // so we need roll >= targetPower - totalPower
  const requiredRoll = targetPower - totalPower;
  let chance = 0;
  if (requiredRoll <= 1) chance = 100;
  else if (requiredRoll > 5) chance = 0;
  else chance = ((6 - requiredRoll) / 5) * 100;

  const handleStart = () => {
    setResolving(true);
  };

  const isAgotado = soldier.fatigue >= 100;

  return (
    <PageTransition>
      <div className="space-y-6 relative">
        {resolving && (
          <MissionCanvasResolver
            mission={mission}
            soldier={soldier}
            onComplete={(victory) => {
              const res = startMission(mission.id);
              if (res.ok) {
                if (res.eventTriggered) {
                  setResolving(false);
                } else if (res.reportId) {
                  router.push(`/reports/${res.reportId}`);
                }
              } else {
                setResolving(false);
              }
            }}
          />
        )}

        {/* Header */}
        <div className="border-b border-iron pb-3 flex justify-between items-center">
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-gold uppercase">ORDEN DE OPERACIÓN</h1>
            <p className="text-xs text-text-muted">Briefing oficial de la misión encomendada</p>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1.1fr]">
        {/* Left: Details */}
        <div className="space-y-6">
          <Card title={mission.title}>
            <div className="space-y-4">
              <Badge variant="gold">Misión de Tipo: <span className="capitalize">{mission.type}</span></Badge>
              
                <div className="prose text-sm text-text-muted leading-relaxed font-serif">
                <p>
                  Sargento Mayor Gonzalo de Vargas ha emitido esta orden para patrullar y asegurar las inmediaciones. 
                  Se reporta presencia de partidas enemigas en los caminos enfangados del valle. Se requiere que marches en orden cerrado, 
                  evitando rezagarte y prestando atención a posibles emboscadas de infantería enemiga.
                </p>
                <p className="mt-2">
                  La resolución es automática basada en tus atributos y pertrechos actuales. El cansancio extremo y las heridas abiertas mermarán significativamente tu capacidad.
                </p>
              </div>

              {/* Requirements & Costs */}
              <div className="grid gap-4 sm:grid-cols-3 border-t border-iron pt-4 font-mono text-sm text-text-muted">
                <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-1">
                  <span className="text-xs uppercase text-muted block">Habilidad Requerida</span>
                  <span className="font-sans font-bold capitalize text-gold-soft">{statLabels[relevantStat] || relevantStat}</span>
                </div>
                <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-1">
                  <span className="text-xs uppercase text-muted block">Costo de Esfuerzo</span>
                  <span className="font-sans font-bold text-ember">+{mission.fatigue} Fatiga</span>
                </div>
                <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-1">
                  <span className="text-xs uppercase text-muted block">Peligro de Herida</span>
                  <span className="font-sans font-bold text-danger">{mission.woundChance}% de probabilidad</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Odds & Combat Comparison */}
          <Card title="Estimación del Enfrentamiento">
            <div className="grid gap-6 sm:grid-cols-2 text-sm font-mono">
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono tracking-widest text-muted border-b border-iron pb-1">Tu Poder Militar</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Atributo de Combate:</span>
                    <span>{soldier.stats[relevantStat] + Number(equipmentBonuses[relevantStat] ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disciplina de Grupo:</span>
                    <span>{soldier.stats.discipline + Number(equipmentBonuses.discipline ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vigor Físico:</span>
                    <span>{soldier.stats.vigor + Number(equipmentBonuses.vigor ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-danger">
                    <span>Penalización Heridas:</span>
                    <span>-{woundPenalty}</span>
                  </div>
                  <div className="flex justify-between text-danger">
                    <span>Penalización Fatiga:</span>
                    <span>-{fatiguePenalty}</span>
                  </div>
                  <div className="flex justify-between border-t border-iron/80 pt-1 font-bold text-gold-soft">
                    <span>Poder Efectivo:</span>
                    <span>{totalPower}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono tracking-widest text-muted border-b border-iron pb-1">Dificultad de la Misión</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Nivel de Dificultad:</span>
                    <span>{mission.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Poder de Enemigos:</span>
                    <span>{enemyPower}</span>
                  </div>
                  <div className="flex justify-between border-t border-iron/80 pt-1 font-bold text-danger">
                    <span>Poder Objetivo:</span>
                    <span>{targetPower}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-stone-900/60 border border-iron rounded-xs text-center space-y-1 font-sans">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-mono">Probabilidad de Éxito Estimada</p>
                  <p className={`text-2xl font-bold font-cinzel ${
                    chance >= 80 ? "text-success" : chance >= 50 ? "text-warning" : "text-danger"
                  }`}>
                    {chance}%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Actions & Info */}
        <div className="space-y-4">
          {/* Mission Scene Illustration */}
          <div className="scene-frame relative w-full h-64 md:h-80 rounded-md overflow-hidden">
            <img
              src={getMissionSceneImagePath(mission.id)}
              alt={mission.title}
              className="scene-image-realism w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/10 pointer-events-none" />
            <div className="absolute bottom-2 left-3 font-cinzel text-xs text-gold uppercase tracking-wider">
              {mission.type}
            </div>
          </div>

          <Card title="Suministros y Recompensas">
            <div className="space-y-4 text-xs font-mono">
              {/* Rewards */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-muted">Recompensas en caso de Éxito:</h4>
                <div className="p-2.5 bg-background border border-iron rounded-xs space-y-1 text-[11px]">
                  <div className="flex justify-between text-gold">
                    <span>Doblones de paga:</span>
                    <span className="font-bold">+{mission.rewards.coins} dob.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experiencia (XP):</span>
                    <span className="font-bold text-text">+{mission.rewards.xp} XP</span>
                  </div>
                  <div className="flex justify-between text-amber">
                    <span>Honor militar:</span>
                    <span className="font-bold">+{mission.rewards.honor} hon.</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-iron">
                <button
                  onClick={handleStart}
                  disabled={isAgotado || resolving}
                  className={`w-full py-3 text-sm font-mono font-bold uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                    isAgotado || resolving
                      ? "bg-stone-900 border-iron text-muted cursor-not-allowed"
                      : "bg-blood border-blood-bright text-text hover:bg-blood-bright hover:text-white"
                  }`}
                >
                  {resolving 
                    ? "Resolviendo escaramuza..." 
                    : isAgotado 
                    ? "Demasiado Agotado" 
                    : "Iniciar Misión"}
                </button>
                
                {isAgotado && (
                  <p className="text-xs text-danger mt-2 font-sans text-center flex items-center justify-center gap-1">
                    <UiAssetIcon id="confirm" label="Aviso" className="h-4 w-4" />
                    <span>Diego está agotado. Descansa en el hospital antes de marchar.</span>
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
