"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { getMission, getItem, getWound } from "@/lib/game-data";
import { ScrollText, ArrowRight, HeartPulse, ShieldAlert, Coins } from "lucide-react";
import { playVictorySound, playDefeatSound } from "@/lib/sounds";
import confetti from "canvas-confetti";
import { PageTransition } from "@/components/game/page-transition";

export default function ReportPage() {
  const params = useParams();
  const { reports } = useGameStore();
  const [mounted, setMounted] = useState(false);

  const id = params.id as string;
  const report = reports.find((r) => r.id === id);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && report) {
      if (report.success) {
        playVictorySound();
        const duration = 1.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 40 * (timeLeft / duration);
          // Golden coin colors
          confetti({ 
            ...defaults, 
            particleCount, 
            origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 },
            colors: ["#d4a74c", "#c9a24f", "#f7d283", "#ffd700"]
          });
          confetti({ 
            ...defaults, 
            particleCount, 
            origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 },
            colors: ["#d4a74c", "#c9a24f", "#f7d283", "#ffd700"]
          });
        }, 200);

        return () => clearInterval(interval);
      } else {
        playDefeatSound();
      }
    }
  }, [mounted, report]);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando informe...</div>;
  }

  if (!report) {
    return (
      <Card title="Informe No Encontrado">
        <p className="text-xs text-text-muted">El informe solicitado no existe o pertenece a otra campaña.</p>
        <Link href="/barracks" className="text-gold underline text-xs mt-4 inline-block">Volver al cuartel</Link>
      </Card>
    );
  }

  const mission = getMission(report.missionId);

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-iron pb-3">
        <h1 className="font-cinzel text-2xl font-bold text-gold uppercase">DIARIO DE CAMPAÑA</h1>
        <p className="text-xs text-text-muted">Informe militar sellado y registrado</p>
      </div>

      {/* Parchment Document */}
      <div className="parchment-card p-6 md:p-10 rounded-sm border border-parchment-dark shadow-2xl relative">
        {/* Wax Seal Decoration */}
        <div className="absolute top-6 right-6 w-14 h-14 bg-blood-bright/20 border-2 border-blood-bright rounded-full opacity-60 flex items-center justify-center font-cinzel text-blood text-[8px] font-bold select-none rotate-12">
          TERCIO VIII
        </div>

        {/* Sender / Recipient */}
        <div className="border-b border-parchment-dark/30 pb-4 mb-6 font-serif text-stone-850 text-xs md:text-sm space-y-1">
          <p><strong>De:</strong> Sargento Mayor Gonzalo de Vargas</p>
          <p><strong>Para:</strong> Capitán Rodrigo, Compañía de Flandes</p>
          <p><strong>Fecha:</strong> {new Date(report.createdAt).toLocaleDateString("es-ES")} - Campaña de los Países Bajos</p>
          <p><strong>Asunto:</strong> Resolución de escaramuza en {mission?.title ?? report.missionId.replace(/_/g, " ")}</p>
        </div>

        {/* Success Badge */}
        <div className="mb-6 flex justify-center">
          <span className={`px-4 py-1.5 text-sm font-cinzel font-bold border-2 rounded-xs tracking-wider shadow-sm rotate-[-1deg] ${
            report.success 
              ? "text-success border-success bg-success/10" 
              : "text-danger border-danger bg-danger/10"
          }`}>
            {report.success ? "¡VICTORIA EN CAMPAÑA!" : "INFORMADA DERROTA"}
          </span>
        </div>

        {/* Narrative Text */}
        <div className="space-y-4">
          <p className="whitespace-pre-line report-text leading-relaxed text-stone-800 text-base md:text-lg italic font-serif">
            "{report.report}"
          </p>
        </div>

        {/* Wounds & Loot Warnings */}
        {report.wounds.length > 0 && (
          <div className="mt-6 p-3 bg-danger/10 border border-danger/35 rounded-xs flex gap-2 items-start text-xs font-serif text-stone-850">
            <ShieldAlert className="w-4 h-4 text-blood-bright shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase">Herida Sufrida en el Asalto:</p>
              <p>
                El cirujano reporta: <strong>{report.wounds.map(wId => getWound(wId)?.name ?? wId).join(", ")}</strong>. 
                Requiere vendaje inmediato en el Hospital de Sangre para evitar fiebres y penalizaciones.
              </p>
            </div>
          </div>
        )}

        {report.loot.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-700/30 rounded-xs flex gap-2 items-start text-xs font-serif text-stone-850">
            <Coins className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase">Botín Confiscado:</p>
              <p>
                Se ha incautado y transferido al macuto:{" "}
                <strong>{report.loot.map(item => `${getItem(item.itemId)?.name ?? item.itemId} (x${item.quantity})`).join(", ")}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-10 pt-6 border-t border-parchment-dark/30 flex justify-between items-end font-serif text-[11px] text-stone-600">
          <div>
            <p>Registrado por el Escribano</p>
            <p className="font-bold mt-4">J. de Aldana</p>
          </div>
          <div className="text-right">
            <p>Autorizado por el Comandante</p>
            <p className="font-bold mt-4">G. de Vargas</p>
          </div>
        </div>
      </div>

      {/* Rewards Bar & Action Buttons */}
      <div className="game-panel p-5 border border-iron rounded-xs space-y-4">
        <div>
          <h4 className="text-[11px] font-mono uppercase tracking-widest text-muted border-b border-iron pb-1.5 mb-2.5">
            Efecto del informe en el campamento:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
            <div className="p-2 bg-stone-900 border border-iron rounded-xs">
              <span className="text-[9px] uppercase text-muted block">Doblones</span>
              <span className="font-bold text-gold">+{report.rewards.coins}</span>
            </div>
            <div className="p-2 bg-stone-900 border border-iron rounded-xs">
              <span className="text-[9px] uppercase text-muted block">Experiencia</span>
              <span className="font-bold text-text">+{report.rewards.xp} XP</span>
            </div>
            <div className="p-2 bg-stone-900 border border-iron rounded-xs">
              <span className="text-[9px] uppercase text-muted block">Honor</span>
              <span className="font-bold text-amber">+{report.rewards.honor}</span>
            </div>
            <div className="p-2 bg-stone-900 border border-iron rounded-xs">
              <span className="text-[9px] uppercase text-muted block">Fatiga</span>
              <span className="font-bold text-ember">+{report.fatigue}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/barracks"
            className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 border border-iron text-xs font-mono font-bold uppercase tracking-wider text-text-muted hover:text-text rounded-xs text-center transition-all cursor-pointer"
          >
            Volver al Cuartel
          </Link>
          
          {report.wounds.length > 0 && (
            <Link
              href="/hospital"
              className="flex-1 py-2.5 bg-blood hover:bg-blood-bright border border-blood-bright text-xs font-mono font-bold uppercase tracking-wider text-text hover:text-white rounded-xs text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer animate-pulse"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Tratar Heridas en Hospital</span>
            </Link>
          )}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
