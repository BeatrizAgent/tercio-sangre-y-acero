"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { featuredAssetPaths, getItem, getItemImagePath, getWound } from "@/lib/game-data";
import { HospitalSurgeonPlaceholder } from "@/components/game/placeholder-art";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { playCoinSound, playDrumSound, playDefeatSound, playPageSound } from "@/lib/sounds";

import { PageTransition } from "@/components/game/page-transition";

export default function HospitalPage() {
  const { soldier, treatWound, payTownBribe } = useGameStore();
  const [notification, setNotification] = useState<{ text: string; isError: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando hospital de campaña...</div>;
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

  const handleTreat = (woundId: string) => {
    const res = treatWound(woundId);
    if (res.ok) {
      playPageSound(); // Bandaging sound
      setNotification({ text: `¡Éxito! ${res.message}`, isError: false });
    } else {
      playDefeatSound();
      setNotification({ text: `Error: ${res.message}`, isError: true });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRest = () => {
    if (soldier.coins < 5) {
      playDefeatSound();
      setNotification({ text: "Error: No tienes suficientes doblones (coste: 5 dob.) para el reposo en camastro.", isError: true });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    if (soldier.fatigue === 0) {
      playDefeatSound();
      setNotification({ text: "Advertencia: Diego de Arce ya se encuentra totalmente descansado.", isError: true });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    // Rest fatigue reduction
    useGameStore.setState((state) => ({
      soldier: {
        ...state.soldier,
        coins: Math.max(0, state.soldier.coins - 5),
        fatigue: Math.max(0, state.soldier.fatigue - 25)
      }
    }));
    playCoinSound();
    setTimeout(() => playDrumSound(), 100);
    setNotification({ text: "¡Éxito! Reposo completado. Has recuperado 25 puntos de fatiga por 5 doblones.", isError: false });
    setTimeout(() => setNotification(null), 3000);
  };


  // Find bandage quantity
  const bandageCount = soldier.inventory.find((i) => i.itemId === "clean_bandage")?.quantity ?? 0;
  const wineSkinCount = soldier.inventory.find((i) => i.itemId === "wine_skin")?.quantity ?? 0;

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-iron pb-3">
        <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">HOSPITAL DE SANGRE</h1>
        <p className="text-xs text-text-muted">Cura heridas abiertas y recupera la fatiga acumulada en combate</p>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div 
          className={`p-3 text-xs font-mono border rounded-xs transition-all ${
            notification.isError 
              ? "bg-danger/20 border-danger text-danger" 
              : "bg-success/20 border-success text-success"
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1.1fr]">
        {/* Left Column: Wounds List & Resting */}
        <div className="space-y-6">
          {/* Active Wounds Panel */}
          <Card title="Tratamiento de Heridas">
            {soldier.wounds.length === 0 ? (
              <div className="border border-dashed border-iron p-8 text-center text-xs text-muted">
                No hay heridas abiertas que requieran vendaje en este momento. ¡Diego está sano!
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-muted font-serif italic mb-2">
                  Selecciona una de las heridas para aplicarle vendas de lino limpias. Las heridas abiertas restan 2 puntos a todos los atributos de combate por cada una.
                </p>

                <div className="space-y-3">
                  {soldier.wounds.map((active) => {
                    const woundDef = getWound(active.woundId);
                    const canTreat = bandageCount > 0 && !active.treated;

                    return (
                      <div 
                        key={active.id} 
                        className="p-3 bg-stone-900/60 border border-iron rounded-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gold/10 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-cinzel text-base font-bold text-gold-soft capitalize">
                              {woundDef?.name ?? active.woundId}
                            </h3>
                            <Badge variant={active.treated ? "success" : "danger"}>
                              {active.treated ? "Vendada" : "Abierta"}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-muted font-serif italic mt-0.5">
                            "{woundDef?.description ?? "Herida sufrida en la refriega."}"
                          </p>
                          <p className="text-[10px] font-mono text-muted uppercase mt-1">
                            Gravedad: {woundDef?.severity} | Penalización: {active.treated ? "Ninguna" : "-2 en Combate"}
                          </p>
                        </div>

                        {!active.treated ? (
                          <button
                            onClick={() => handleTreat(active.id)}
                            disabled={!canTreat}
                            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xs border transition-all cursor-pointer ${
                              canTreat
                                ? "bg-blood border-blood-bright text-text hover:bg-blood-bright"
                                : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                            }`}
                          >
                            {bandageCount === 0 ? "Falta Venda" : "Vendar herida"}
                          </button>
                        ) : (
                          <span className="text-xs font-mono font-bold text-success pr-2">Cerrada</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Resting Section */}
          <Card title="Reposo en Camastro">
            <div className="space-y-4 font-mono text-xs">
              <div className="asset-icon-frame h-32 overflow-hidden rounded-xs border border-iron bg-stone-950">
                <img
                  src="/assets/gpt-bank/icons-ui/camastro_manta_lana.png"
                  alt="Camastro de campaña"
                  className="h-full w-full object-contain p-3"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <p className="text-xs font-serif italic text-text-muted leading-relaxed font-sans">
                Puedes ordenar a tu soldado guardar reposo en los camastros del hospital. 
                El descanso prolongado reduce la fatiga física, pero el cirujano cobra una pequeña tarifa por su estancia y cuidado.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-1">
                  <span className="text-[9px] uppercase text-muted block">Efecto del Reposo</span>
                  <span className="font-sans font-bold text-success flex items-center gap-1">
                    <UiAssetIcon id="fatigue" label="Fatiga" className="h-4 w-4" />
                    <span>-25 Fatiga</span>
                  </span>
                </div>
                <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-1">
                  <span className="text-[9px] uppercase text-muted block">Coste del Reposo</span>
                  <span className="font-sans font-bold text-gold flex items-center gap-1">
                    <UiAssetIcon id="coins" label="Doblones" className="h-4 w-4" />
                    <span>5 Doblones</span>
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRest}
                  disabled={soldier.coins < 5 || soldier.fatigue === 0}
                  className={`w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                    soldier.coins >= 5 && soldier.fatigue > 0
                      ? "bg-yellow-800/80 border-yellow-600/40 text-text hover:bg-yellow-750"
                      : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                  }`}
                >
                  Descansar en Camastro
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Surgeon Speech & Supplies Status */}
        <div className="space-y-6">
          {/* Surgeon wisdom speech */}
          <div className="game-panel p-4 border border-iron rounded-xs bg-linear-to-b from-stone-900 to-stone-950 flex gap-3">
            <div className="w-12 h-12 border border-gold/30 bg-panel-raised rounded-full shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src={featuredAssetPaths.fieldSurgeonPortrait}
                alt="Médico del Tercio"
                className="portrait-realism w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div>
              <p className="text-[10px] text-gold uppercase font-mono tracking-widest font-bold">Médico del Tercio</p>
              <p className="text-[11px] font-serif italic text-text-muted mt-1 leading-relaxed">
                "Si la herida supura, aplica vino hervido y reza tres padrenuestros. Si el brazo se pone negro, no pierdas tiempo y prepara la sierra, muchacho. Los hombres duros no lloran ante el acero."
              </p>
            </div>
          </div>

          {/* Supplies Card */}
          <Card title="Inventario de Medicina">
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between gap-3 border-b border-iron pb-2">
                <span className="flex items-center gap-2 text-text-muted">
                  <img
                    src={getItemImagePath("clean_bandage")}
                    alt=""
                    className="h-9 w-9 shrink-0 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span>Vendas Limpias (Bandages):</span>
                </span>
                <span className={bandageCount > 0 ? "text-success font-bold" : "text-danger font-bold"}>
                  {bandageCount} disp.
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-iron pb-2">
                <span className="flex items-center gap-2 text-text-muted">
                  <img
                    src={getItemImagePath("wine_skin")}
                    alt=""
                    className="h-9 w-9 shrink-0 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span>Odras de Vino (Wine Skins):</span>
                </span>
                <span className="text-text font-bold">{wineSkinCount} disp.</span>
              </div>
              
              <div className="bg-stone-900/50 p-2.5 border border-iron text-[11px] text-text-muted font-sans leading-relaxed">
                <p className="flex gap-1.5 items-start">
                  <UiAssetIcon id="confirm" label="Aviso" className="h-4 w-4 mt-0.5" />
                  <span>
                    Puedes comprar más <strong>Vendas Limpias</strong> en la armería por 9 doblones para asegurar que tienes existencias antes de partir a misiones difíciles.
                  </span>
                </p>
              </div>
            </div>
          </Card>

          {/* Silhouette Placeholders */}
          <Card title="Anatomía de Campaña">
            <div className="h-64 rounded-xs overflow-hidden border border-iron">
              <HospitalSurgeonPlaceholder className="w-full h-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
