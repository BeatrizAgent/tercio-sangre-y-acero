"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { getWound } from "@/lib/game-data";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { HospitalSkeleton } from "@/components/skeletons/hospital-skeleton";
import { playCoinSound, playDefeatSound, playDrumSound, playPageSound } from "@/lib/sounds";
import { PageTransition } from "@/components/game/page-transition";
import { useGameData } from "@/lib/hooks/use-game-data";

export default function HospitalPage() {
  const { status } = useGameData();
  const { soldier, treatWound, payTownBribe } = useGameStore();
  const [notification, setNotification] = useState<{ text: string; isError: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted || status !== "ready") {
    return (
      <PageTransition>
        <HospitalSkeleton />
      </PageTransition>
    );
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
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-col gap-3 border-b border-iron pb-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">HOSPITAL DE SANGRE</h1>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase">
            <span className="rounded-xs border border-iron bg-stone-900 px-2 py-1 text-muted">
              Fatiga {soldier.fatigue}
            </span>
            <span className="rounded-xs border border-iron bg-stone-900 px-2 py-1 text-muted">
              Vendas {bandageCount}
            </span>
            <span className="rounded-xs border border-iron bg-stone-900 px-2 py-1 text-gold">
              {soldier.coins} doblones
            </span>
          </div>
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

        <Card title="Heridas">
          {soldier.wounds.length === 0 ? (
            <div className="border border-dashed border-iron p-6 text-center text-xs text-muted">
              Sin heridas abiertas.
            </div>
          ) : (
            <div className="divide-y divide-iron">
              {soldier.wounds.map((active) => {
                const woundDef = getWound(active.woundId);
                const canTreat = bandageCount > 0 && !active.treated;

                return (
                  <div
                    key={active.id}
                    className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-cinzel text-base font-bold text-gold-soft capitalize">
                          {woundDef?.name ?? active.woundId}
                        </h3>
                        <Badge variant={active.treated ? "success" : "danger"}>
                          {active.treated ? "Vendado" : "Abierto"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[10px] font-mono uppercase text-muted">
                        Gravedad {woundDef?.severity ?? "-"} | {active.treated ? "Sin penalizacion" : "-2 combate"}
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
                        {bandageCount === 0 ? "Falta venda" : "Vendar"}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Reposo">
          <div className="flex flex-col gap-3 text-xs font-mono sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted">
              <span className="text-success">-25 fatiga</span>
              <span className="mx-2 text-iron">|</span>
              <span className="text-gold">5 doblones</span>
            </div>
            <button
              onClick={handleRest}
              disabled={soldier.coins < 5 || soldier.fatigue === 0}
              className={`px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
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
    </PageTransition>
  );
}
