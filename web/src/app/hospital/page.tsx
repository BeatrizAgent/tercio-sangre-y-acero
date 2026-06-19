"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { getItemImagePath, getWound } from "@/lib/game-data";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { playCoinSound, playDefeatSound, playDrumSound, playPageSound } from "@/lib/sounds";
import { PageTransition } from "@/components/game/page-transition";
import { Tooltip } from "@/components/ui/tooltip";

export default function HospitalPage() {
  const { soldier, treatWound, payTownBribe } = useGameStore();
  const [notification, setNotification] = useState<{ text: string; isError: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando hospital de campana...</div>;
  }

  const showNotification = (text: string, isError: boolean) => {
    setNotification({ text, isError });
    window.setTimeout(() => setNotification(null), 3000);
  };

  const handleTreat = (woundId: string) => {
    const res = treatWound(woundId);
    if (res.ok) {
      playPageSound();
      showNotification(res.message, false);
    } else {
      playDefeatSound();
      showNotification(res.message, true);
    }
  };

  const handleRest = () => {
    if (soldier.coins < 5) {
      playDefeatSound();
      showNotification("No tienes suficientes doblones.", true);
      return;
    }
    if (soldier.fatigue === 0) {
      playDefeatSound();
      showNotification("Diego ya esta descansado.", true);
      return;
    }

    useGameStore.setState((state) => ({
      soldier: {
        ...state.soldier,
        coins: Math.max(0, state.soldier.coins - 5),
        fatigue: Math.max(0, state.soldier.fatigue - 25),
      },
    }));
    playCoinSound();
    window.setTimeout(() => playDrumSound(), 100);
    showNotification("Reposo completado. -25 fatiga, -5 doblones.", false);
  };

  const handleBribe = () => {
    const res = payTownBribe();
    if (res.ok) playCoinSound();
    else playDefeatSound();
    showNotification(res.message, !res.ok);
  };

  const bandageCount = soldier.inventory.find((i) => i.itemId === "objeto_002")?.quantity ?? 0;
  const wineSkinCount = soldier.inventory.find((i) => i.itemId === "wine_skin")?.quantity ?? 0;

  if (soldier.banMissionsLeft > 0) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto text-center space-y-6 py-12">
          <Card title="Acceso prohibido">
            <div className="p-6 space-y-6 text-center">
              <div className="w-20 h-20 bg-danger/10 border border-danger/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <UiAssetIcon id="confirm" label="Acceso prohibido" className="h-12 w-12" />
              </div>
              <h3 className="font-cinzel text-xl font-bold text-gold uppercase">Expulsado del pueblo</h3>
              <div className="p-3 bg-stone-900 border border-iron rounded-xs text-xs font-mono">
                Quedan <strong className="text-danger">{soldier.banMissionsLeft}</strong> misiones de destierro.
              </div>
              <button
                onClick={handleBribe}
                disabled={soldier.coins < 50}
                className={`px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                  soldier.coins >= 50
                    ? "bg-gold/15 border-gold text-gold hover:bg-gold/25"
                    : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                }`}
              >
                Sobornar al alguacil (50)
              </button>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="border-b border-iron pb-3">
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">HOSPITAL DE SANGRE</h1>
        </div>

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

        <div className="grid gap-6 lg:grid-cols-[2fr_1.1fr]">
          <div className="space-y-6">
            <Card title="Tratamiento de heridas">
              {soldier.wounds.length === 0 ? (
                <div className="border border-dashed border-iron p-8 text-center text-xs text-muted">
                  Sin heridas abiertas.
                </div>
              ) : (
                <div className="space-y-3">
                  {soldier.wounds.map((active) => {
                    const woundDef = getWound(active.woundId);
                    const canTreat = bandageCount > 0 && !active.treated;

                    return (
                      <div
                        key={active.id}
                        className="p-3 bg-stone-900/60 border border-iron rounded-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gold/10 transition-all"
                      >
                        <Tooltip type="wound" woundId={active.woundId} treated={active.treated}>
                          <div className="cursor-help hover:bg-stone-900/20 p-1.5 rounded-xs transition-colors">
                            <div className="flex items-center gap-2">
                              <h3 className="font-cinzel text-base font-bold text-gold-soft capitalize">
                                {woundDef?.name ?? active.woundId}
                              </h3>
                              <Badge variant={active.treated ? "success" : "danger"}>
                                {active.treated ? "Vendada" : "Abierta"}
                              </Badge>
                            </div>
                            <p className="text-[10px] font-mono text-muted uppercase mt-1">
                              Gravedad: {woundDef?.severity} | Penalizacion: {active.treated ? "Ninguna" : "-2 combate"}
                            </p>
                          </div>
                        </Tooltip>

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
                            {bandageCount === 0 ? "Falta venda" : "Vendar"}
                          </button>
                        ) : (
                          <span className="text-xs font-mono font-bold text-success pr-2">Cerrada</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title="Reposo en camastro">
              <div className="space-y-4 font-mono text-xs">
                <div className="asset-icon-frame h-32 overflow-hidden rounded-xs border border-iron bg-stone-950">
                  <img
                    src="/assets/gpt-bank/icons-ui/camastro_manta_lana.png"
                    alt="Camastro de campana"
                    className="h-full w-full object-contain p-3"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <RestTile icon="fatigue" label="Efecto" value="-25 fatiga" tone="text-success" />
                  <RestTile icon="coins" label="Coste" value="5 doblones" tone="text-gold" />
                </div>

                <button
                  onClick={handleRest}
                  disabled={soldier.coins < 5 || soldier.fatigue === 0}
                  className={`w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                    soldier.coins >= 5 && soldier.fatigue > 0
                      ? "bg-yellow-800/80 border-yellow-600/40 text-text hover:bg-yellow-750"
                      : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                  }`}
                >
                  Descansar
                </button>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Medicina">
              <div className="space-y-3 text-xs font-mono">
                <SupplyRow itemId="objeto_002" label="Vendas de lino" value={`${bandageCount} disp.`} tone={bandageCount > 0 ? "text-success" : "text-danger"} />
                <SupplyRow itemId="wine_skin" label="Odras de vino" value={`${wineSkinCount} disp.`} tone="text-text" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function RestTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentProps<typeof UiAssetIcon>["id"];
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="p-3 bg-stone-900/60 border border-iron rounded-xs space-y-1">
      <span className="text-[9px] uppercase text-muted block">{label}</span>
      <span className={`font-sans font-bold flex items-center gap-1 ${tone}`}>
        <UiAssetIcon id={icon} label={label} className="h-4 w-4" />
        <span>{value}</span>
      </span>
    </div>
  );
}

function SupplyRow({
  itemId,
  label,
  value,
  tone,
}: {
  itemId: string;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-iron pb-2 last:border-0">
      <span className="flex items-center gap-2 text-text-muted">
        <img
          src={getItemImagePath(itemId)}
          alt=""
          className="h-9 w-9 shrink-0 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <span>{label}</span>
      </span>
      <span className={`font-bold ${tone}`}>{value}</span>
    </div>
  );
}
