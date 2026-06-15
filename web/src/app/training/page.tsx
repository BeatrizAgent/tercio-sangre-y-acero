"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge, SubmitButton } from "@/components/ui/card";
import { trainingAssetPaths, trainingOptions } from "@/lib/game-data";
import { playDrumSound, playDefeatSound, playCoinSound } from "@/lib/sounds";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { Tooltip } from "@/components/ui/tooltip";

import { PageTransition } from "@/components/game/page-transition";

export default function TrainingPage() {
  const { soldier, trainStat, payTownBribe } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando zona de entrenamiento...</div>;
  }

  if (soldier.banMissionsLeft > 0) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto text-center space-y-6 py-12">
          <Card title="¡ACCESO PROHIBIDO!">
            <div className="p-6 space-y-6 text-center">
              <div className="w-20 h-20 bg-danger/10 border border-danger/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <UiAssetIcon id="confirm" label="Acceso prohibido" className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="font-cinzel text-xl font-bold text-gold uppercase">Expulsado del Pueblo</h3>
                <p className="text-xs text-text-muted font-mono uppercase">
                  Falta de disciplina y desmanes en la comarca
                </p>
              </div>
              <p className="text-sm font-serif italic text-text-muted leading-relaxed">
                "¡Fuera de aquí, ralea del Tercio! Los mercaderes han cerrado sus tiendas y el cirujano ha trancado su puerta. No toleramos a ladrones ni saqueadores en nuestras murallas. Volved al camino y no regreséis hasta que hayáis cumplido vuestro castigo militar."
              </p>
              <div className="p-3 bg-stone-900 border border-iron rounded-xs text-xs font-mono">
                <p>Quedan <strong className="text-danger">{soldier.banMissionsLeft}</strong> misiones de destierro para expiar tus faltas.</p>
              </div>
              <div className="pt-4 border-t border-iron/50 space-y-3">
                <p className="text-[10px] text-text-muted font-sans">
                  Puedes sobornar al alguacil del pueblo para que haga la vista gorda y te permita volver de inmediato.
                </p>
                <button
                  onClick={() => {
                    const res = payTownBribe();
                    if (res.ok) {
                      playCoinSound();
                    } else {
                      playDefeatSound();
                    }
                  }}
                  disabled={soldier.coins < 50}
                  className={`px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                    soldier.coins >= 50
                      ? "bg-gold/15 border-gold text-gold hover:bg-gold/25"
                      : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                  }`}
                >
                  Sobornar al Alguacil (50 doblones)
                </button>
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const handleTrain = (stat: any, name: string) => {
    const res = trainStat(stat);
    if (res.ok) {
      playDrumSound();
      setMessage({ text: `¡Éxito! ${res.message}`, isError: false });
    } else {
      playDefeatSound();
      setMessage({ text: `Error: ${res.message}`, isError: true });
    }
    setTimeout(() => setMessage(null), 4000);
  };


  const options = trainingOptions;

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-iron pb-3">
        <div>
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">CAMPO DE ENTRENAMIENTO</h1>
          <p className="text-xs text-text-muted">Fortalece tus habilidades a cambio de doblones y esfuerzo físico</p>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div 
          className={`p-3 text-xs font-mono border rounded-xs transition-all ${
            message.isError 
              ? "bg-danger/20 border-danger text-danger animate-bounce" 
              : "bg-success/20 border-success text-success"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Training Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left: Cards for each discipline */}
        <div className="space-y-4">
          <Card title="Ejercicios de la Compañía">
            <div className="grid gap-4 sm:grid-cols-2">
              {options.map((option) => {
                const currentVal = soldier.stats[option.stat] ?? 0;
                const costCoins = option.cost.coins;
                const costXp = option.cost.xp;
                const canAfford = soldier.coins >= costCoins && soldier.xp >= costXp;
                const isFatigued = soldier.fatigue >= 100;

                return (
                  <div 
                    key={option.stat} 
                    className="p-4 bg-stone-900/60 border border-iron rounded-xs flex flex-col justify-between gap-4 transition-all hover:border-gold/20"
                  >
                    <div>
                      <div className="mb-3 flex items-start gap-3">
                        <div className="asset-icon-frame h-16 w-16 shrink-0 overflow-hidden rounded-xs p-1.5">
                          <img
                            src={trainingAssetPaths[option.stat]}
                            alt={option.name}
                            className="asset-icon-image h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2">
                            <h3 className="font-cinzel text-base font-bold text-text-muted capitalize flex items-center gap-1.5">
                              <span>{option.name}</span>
                              <Tooltip content={option.description} />
                            </h3>
                            <span className="font-mono text-sm font-bold text-gold">{currentVal}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Cost details */}
                      <div className="mt-3 space-y-1 font-mono text-[11px] text-text-muted">
                        <p>Coste: <span className="text-gold-soft">{costCoins} Doblones</span></p>
                        <p>Esfuerzo: <span className="text-ember">+{option.fatigue} Fatiga</span></p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {/* Stat Progress Visual */}
                      <div className="space-y-1">
                        <div className="stat-bar rounded-xs">
                          <div 
                            className="stat-bar-fill transition-all duration-300" 
                            style={{ width: `${Math.min(100, (currentVal / 80) * 100)}%` }} 
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleTrain(option.stat, option.name)}
                        disabled={!canAfford || isFatigued}
                        className={`w-full py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                          !canAfford || isFatigued
                            ? "bg-stone-900 border-iron text-muted cursor-not-allowed"
                            : "bg-blood hover:bg-blood-bright border-blood-bright text-text hover:text-white"
                        }`}
                      >
                        {isFatigued ? "Agotado" : !canAfford ? "Falta Oro/XP" : "Entrenar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Fatigue and guidelines */}
        <div className="space-y-6">
          {/* Fatigue status box */}
          <Card title="Estado Físico del Recluta">
            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between">
                <span>Fatiga Actual:</span>
                <span className={soldier.fatigue > 75 ? "text-danger font-bold" : "text-text"}>
                  {soldier.fatigue} / 100
                </span>
              </div>
              <div className="stat-bar rounded-xs">
                <div 
                  className={`h-full transition-all duration-300 ${soldier.fatigue > 75 ? "bg-danger" : "bg-ember"}`}
                  style={{ width: `${soldier.fatigue}%` }}
                />
              </div>

              <div className="bg-stone-900/60 p-3 border border-iron rounded-xs text-sm text-text-muted space-y-2 font-sans">
                <p className="flex gap-2 items-start">
                  <UiAssetIcon id="fatigue" label="Fatiga" className="h-5 w-5 mt-0.5" />
                  <span>
                    El entrenamiento físico aumenta tu fatiga. Si llega a <strong>100</strong>, no podrás entrenar más hasta que descanses o completes misiones.
                  </span>
                </p>
                <p className="flex gap-2 items-start border-t border-iron/60 pt-2">
                  <UiAssetIcon id="info" label="Informacion" className="h-5 w-5 mt-0.5" />
                  <span>
                    Una fatiga alta perjudica tu efectividad en las misiones. Cura tus heridas o descansa en el hospital si necesitas rebajarla.
                  </span>
                </p>
              </div>
            </div>
          </Card>

          {/* Advice / Recommendation panel */}
          <Card title="Recomendación del Cabo">
            <div className="p-3 bg-linear-to-b from-panel-raised to-stone-950 border border-iron rounded-xs">
              <p className="font-serif italic text-xs text-text-muted leading-relaxed">
                "Bisoño, tu manejo de la pica ({soldier.stats.pike}) es lo que mantendrá con cabeza a esta escuadra. Si pretendes ir a patrullar caminos enfangados, sube primero tu Vigor ({soldier.stats.vigor}) para que el fango no te venza."
              </p>
              <p className="text-[10px] uppercase font-mono text-gold-soft/50 tracking-wider mt-2 text-right">
                — Cabo de Escuadra Guzmán
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
