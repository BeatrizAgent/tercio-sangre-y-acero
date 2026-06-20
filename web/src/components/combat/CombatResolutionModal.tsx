"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Swords, X } from "lucide-react";
import type { CombatResolutionModalProps } from "@/lib/domain/combat/combat-types";
import { outcomeDelayMs } from "@/lib/domain/combat/combat-animation-script";
import { CombatStage } from "./CombatStage";
import { CombatHud } from "./CombatHud";
import { CombatLog } from "./CombatLog";

export function CombatResolutionModal({
  open,
  onClose,
  missionTitle,
  missionId,
  result,
  onContinue,
}: CombatResolutionModalProps) {
  const [ready, setReady] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const activeLogEntry = useMemo(() => {
    return result.eventLog.reduce((active, entry) => (entry.at <= elapsedMs ? entry : active), result.eventLog[0]);
  }, [elapsedMs, result.eventLog]);

  const handleSequenceComplete = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!open) return;
    setReady(false);
    setElapsedMs(0);
    const timer = window.setTimeout(() => setReady(true), outcomeDelayMs);
    return () => window.clearTimeout(timer);
  }, [open, result.success, result.roll, result.target]);

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const startedAt = performance.now();

    const tick = () => {
      setElapsedMs(performance.now() - startedAt);
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [open, result]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/92 p-3 sm:p-5">
      <div className="w-full max-w-5xl overflow-hidden border border-iron bg-panel shadow-2xl">
        <header className="flex items-center justify-between border-b border-iron bg-stone-950/90 px-4 py-3">
          <div>
            <h2 className="flex items-center gap-2 font-cinzel text-sm font-bold uppercase tracking-[0.2em] text-gold">
              <Swords className="h-4 w-4 text-blood-bright" />
              Cruz de Borgoña · Resolución
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase text-text-muted">{missionTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 border border-blood bg-blood/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-blood-bright transition hover:bg-blood hover:text-text"
          >
            Saltar
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        <section className="relative bg-stone-950">
          <CombatStage missionTitle={missionTitle} missionId={missionId} result={result} onSequenceComplete={handleSequenceComplete} />
          <CombatHud result={result} missionTitle={missionTitle} ready={ready} activeLogEntry={activeLogEntry} onContinue={onContinue} />
        </section>

        <CombatLog result={result} elapsedMs={elapsedMs} activeLogEntry={activeLogEntry} />
      </div>
    </div>
  );
}
