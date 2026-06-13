"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { getRankName, getNextRank, getItem, rankDefinitions } from "@/lib/game-data";
import { SoldierPortraitPlaceholder } from "@/components/game/placeholder-art";
import { Shield, Sparkles, ScrollText, Award, Calendar, Heart } from "lucide-react";
import { playPageSound } from "@/lib/sounds";

import { PageTransition } from "@/components/game/page-transition";

export default function SoldierPage() {
  const { soldier, reports } = useGameStore();
  const [activeTab, setActiveTab] = useState<"perfil" | "rasgos" | "historial" | "progresion">("perfil");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando perfil...</div>;
  }

  // Calculate derived stats
  const totalWounds = soldier.wounds.length;
  const openWounds = soldier.wounds.filter(w => !w.treated).length;
  const combatPower = Math.max(1, soldier.stats.pike * 2 + soldier.stats.sword - openWounds * 2 - Math.floor(soldier.fatigue / 10));
  const rangePower = Math.max(1, soldier.stats.arquebus * 2 - openWounds * 2 - Math.floor(soldier.fatigue / 10));
  
  // Traits
  const traits = [
    { name: "Castellano Viejo", desc: "Criado bajo el sol de Toledo. Resistencia al cansancio aumentada." },
    { name: "Sin Paga", desc: "La falta prolongada de soldada incrementa el resentimiento, pero fortalece la astucia." },
    { name: "Hombre de Pica", desc: "El acero largo mantiene a raya a la caballería francesa." }
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-iron pb-3">
        <div>
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">HOJA DE SERVICIO</h1>
          <p className="text-xs text-text-muted">Registro militar oficial del soldado</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-iron/60 gap-1">
        {(["perfil", "rasgos", "historial", "progresion"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { playPageSound(); setActiveTab(tab); }}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all rounded-t-sm border-t border-x cursor-pointer ${
              activeTab === tab
                ? "bg-panel border-iron border-b-background text-gold font-bold"
                : "border-transparent bg-transparent text-text-muted hover:text-text hover:bg-panel-soft/50"
            }`}
          >
            {tab === "perfil" && "Perfil"}
            {tab === "rasgos" && "Rasgos"}
            {tab === "historial" && "Historial"}
            {tab === "progresion" && "Progresión"}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === "perfil" && (
          <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
            {/* Left Side: Portrait & Main Bio */}
            <div className="space-y-6">
              <Card title="Diego de Arce">
                <div className="w-full h-64 rounded-xs overflow-hidden border border-iron shadow-md mb-4">
                  <SoldierPortraitPlaceholder />
                </div>
                <div className="space-y-2 text-xs font-mono text-text-muted">
                  <div className="flex justify-between border-b border-iron pb-1">
                    <span>Rango:</span>
                    <span className="text-gold font-bold capitalize">{getRankName(soldier.rank)}</span>
                  </div>
                  <div className="flex justify-between border-b border-iron pb-1">
                    <span>Compañía:</span>
                    <span className="text-text">Compañía de Flandes</span>
                  </div>
                  <div className="flex justify-between border-b border-iron pb-1">
                    <span>Edad:</span>
                    <span className="text-text">28 Años</span>
                  </div>
                  <div className="flex justify-between border-b border-iron pb-1">
                    <span>Origen:</span>
                    <span className="text-text">Toledo, Castilla</span>
                  </div>
                  <div className="flex justify-between border-b border-iron pb-1">
                    <span>Alistamiento:</span>
                    <span className="text-text">12 de marzo de 1620</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Estado:</span>
                    <span className="text-success font-bold uppercase">Activo</span>
                  </div>
                </div>
              </Card>

              {/* Traits summary */}
              <Card title="Rasgos Activos">
                <div className="space-y-2.5">
                  {traits.map((t) => (
                    <div key={t.name} className="p-2 bg-stone-900/60 border border-iron rounded-xs">
                      <p className="text-xs font-semibold text-gold-soft font-mono">{t.name}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Side: Stats & Equipment Mannequin */}
            <div className="space-y-6">
              {/* Core & Derived Stats */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card title="Atributos Principales">
                  <div className="space-y-2 text-xs font-mono">
                    {Object.entries(soldier.stats).map(([stat, val]) => (
                      <div key={stat} className="flex justify-between border-b border-iron/50 pb-1.5 last:border-0 last:pb-0">
                        <span className="capitalize text-text-muted">
                          {stat === "pike" && "Pica"}
                          {stat === "sword" && "Espada"}
                          {stat === "arquebus" && "Arcabuz"}
                          {stat === "discipline" && "Disciplina"}
                          {stat === "vigor" && "Vigor"}
                          {stat === "cunning" && "Astucia"}
                          {stat === "command" && "Mando"}
                        </span>
                        <span className="text-gold font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Cálculos de Combate">
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-iron/50 pb-1.5">
                      <span>Poder de Acero:</span>
                      <span className="text-text font-bold">{combatPower}</span>
                    </div>
                    <div className="flex justify-between border-b border-iron/50 pb-1.5">
                      <span>Poder de Pólvora:</span>
                      <span className="text-text font-bold">{rangePower}</span>
                    </div>
                    <div className="flex justify-between border-b border-iron/50 pb-1.5">
                      <span>Penalización Heridas:</span>
                      <span className="text-danger font-bold">-{openWounds * 2}</span>
                    </div>
                    <div className="flex justify-between border-b border-iron/50 pb-1.5">
                      <span>Penalización Fatiga:</span>
                      <span className="text-danger font-bold">-{Math.floor(soldier.fatigue / 10)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heridas Activas:</span>
                      <span className={totalWounds > 0 ? "text-warning" : "text-success"}>{totalWounds}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Biography & Equipment details */}
              <Card title="Equipo e Historial de Armas">
                <div className="space-y-3">
                  <p className="text-xs text-text-muted leading-relaxed font-serif">
                    El equipo actual influye directamente en los atributos básicos del soldado. Asegúrate de equipar los mejores morriones y picas disponibles desde el almacén para aumentar las probabilidades de supervivencia en la campaña de Flandes.
                  </p>
                  
                  <div className="grid gap-2 text-xs font-mono">
                    {Object.entries(soldier.equipment).map(([slot, itemId]) => {
                      const item = itemId ? getItem(itemId) : null;
                      return (
                        <div 
                          key={slot} 
                          className="flex justify-between items-center p-2 bg-stone-900/40 border border-iron/60 rounded-xs"
                        >
                          <span className="capitalize text-text-muted">
                            {slot === "head" && "Cabeza (Yelmo)"}
                            {slot === "body" && "Cota/Pecho"}
                            {slot === "mainHand" && "Arma Principal"}
                            {slot === "offHand" && "Mano Secundaria"}
                            {slot === "firearm" && "Arcabuz / Fuego"}
                            {slot === "accessory" && "Accesorios"}
                            {slot === "boots" && "Botas"}
                            {slot === "consumable" && "Consumible"}
                          </span>
                          {item ? (
                            <div className="text-right">
                              <p className="text-gold font-sans font-medium">{item.name}</p>
                              <p className="text-[10px] text-muted italic font-sans">{item.description}</p>
                            </div>
                          ) : (
                            <span className="text-muted/65 italic">- Sin equipar -</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "rasgos" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Rasgos Históricos">
              <div className="space-y-4">
                <p className="text-xs text-text-muted leading-relaxed font-serif">
                  Los rasgos determinan la personalidad y trasfondo del soldado. Muchos se adquieren de forma innata en la cuna castellana, mientras que otros surgen como cicatrices de la campaña o debido al retraso crónico en las pagas militares.
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-cinzel text-sm text-gold font-bold">FE CIEGA</span>
                      <Badge variant="gold">Innato</Badge>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      El soldado lucha bajo el estandarte de la Cruz de Borgoña y confía ciegamente en la providencia. Aumenta la moral y la resistencia a la disciplina adversa en un +1.
                    </p>
                  </div>

                  <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-cinzel text-sm text-gold font-bold">DISCIPLINA FÉRREA</span>
                      <Badge variant="gold">Entrenado</Badge>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Horas de instrucción en las plazas de Flandes. El soldado no retrocede ante las cargas de caballería enemiga. +2 a la habilidad de Pica.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Wounds & Cicatrices">
              <div className="space-y-4">
                <p className="text-xs text-text-muted leading-relaxed font-serif">
                  Las heridas abiertas sin tratar drenan la sangre del soldado y entorpecen sus movimientos. Las heridas tratadas en el hospital ya no penalizan el combate, pero permanecen visibles en su hoja de servicio como prueba de su devoción.
                </p>

                {soldier.wounds.length === 0 ? (
                  <div className="border border-dashed border-iron p-6 text-center text-xs text-muted">
                    Diego no sufre heridas en este momento.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {soldier.wounds.map((w) => {
                      const details = getItem(w.woundId) || { name: w.woundId, description: "Corte o magulladura sufrida en combate." };
                      return (
                        <div key={w.id} className="p-2.5 bg-background border border-iron rounded-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-xs capitalize text-text">{details.name}</span>
                            <span className="block text-[10px] text-text-muted mt-0.5">{w.treated ? "Vendada y limpia." : "Abierta y expuesta a la mugre."}</span>
                          </div>
                          <Badge variant={w.treated ? "success" : "danger"}>
                            {w.treated ? "Tratada" : "Abierta"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "historial" && (
          <Card title="Historial de Campaña">
            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed font-serif">
                El diario de campaña registra las últimas misiones resueltas por la compañía bajo tus órdenes directas. Cada entrada detalla el resultado y las recompensas traídas al campamento.
              </p>

              {reports.length === 0 ? (
                <div className="border border-dashed border-iron p-8 text-center text-xs text-muted">
                  No hay registro de misiones en la hoja de servicio todavía.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div 
                      key={report.id} 
                      className="p-3 bg-stone-900/40 border border-iron rounded-xs flex flex-col md:flex-row justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm font-semibold text-text">
                            Misión: {report.missionId.replace(/_/g, " ")}
                          </span>
                          <Badge variant={report.success ? "success" : "danger"}>
                            {report.success ? "Éxito" : "Fracaso"}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted font-serif italic mt-1 max-w-xl truncate">
                          "{report.report.split("\n")[0]}"
                        </p>
                      </div>
                      <div className="text-right font-mono text-[11px] shrink-0 border-t md:border-t-0 border-iron pt-2 md:pt-0">
                        <p className="text-gold-soft">Doblones: +{report.rewards.coins}</p>
                        <p className="text-text-muted">XP: +{report.rewards.xp} | Honor: +{report.rewards.honor}</p>
                        <p className="text-muted mt-0.5 text-[9px]">{new Date(report.createdAt).toLocaleDateString("es-ES")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === "progresion" && (
          <Card title="Escalafón de Rango (Ascenso)">
            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed font-serif">
                Para ascender de rango dentro de los Tercios de Flandes se requiere acumular tanto experiencia práctica en combate como honor y reputación ante los sargentos y capitanes. El escalafón militar oficial se detalla a continuación:
              </p>

              <div className="space-y-2.5">
                {rankDefinitions.map((rank) => {
                  const isCurrent = soldier.rank === rank.id;
                  const isUnlocked = soldier.xp >= rank.minXp && soldier.honor >= rank.minHonor;
                  
                  return (
                    <div 
                      key={rank.id} 
                      className={`p-3 rounded-xs border transition-all ${
                        isCurrent 
                          ? "bg-panel-raised border-gold text-gold font-bold shadow-sm" 
                          : isUnlocked 
                          ? "bg-stone-900/40 border-iron/60 text-text-muted" 
                          : "bg-background/20 border-iron/30 text-muted"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-cinzel text-sm capitalize">{rank.name}</span>
                        {isCurrent && <span className="text-[10px] uppercase font-mono tracking-wider border border-gold px-1.5 py-0.5 bg-gold/10">Rango Actual</span>}
                      </div>
                      <div className="flex gap-4 text-xs font-mono mt-1 text-text-muted">
                        <span>XP Mínimo: {rank.minXp}</span>
                        <span>Honor Mínimo: {rank.minHonor}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
