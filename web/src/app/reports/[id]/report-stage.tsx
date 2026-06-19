"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  HeartPulse,
  ShieldAlert,
  ArrowRight,
  Skull,
  Sword,
  ChevronRight,
} from "lucide-react";
import {
  getItem,
  getItemImagePath,
  getWound,
  reportAssetPaths,
  uiIconPaths,
} from "@/lib/game-data";
import { playDefeatSound, playDrumSound, playSwordSound, playVictorySound } from "@/lib/sounds";
import { fireCoinRain, fireEmberRain } from "./coin-rain";
import { RewardTile } from "./reward-tile";
import type { MissionDefinition, MissionResult } from "@/lib/types";

type Stage = "sealed" | "breaking" | "scroll" | "loot" | "rewards" | "done";

interface ReportStageProps {
  report: MissionResult;
  mission: MissionDefinition | undefined;
}

const STAGE_TIMING = {
  sealBreakMs: 700,
  scrollUnrollMs: 1100,
  lootRevealMs: 800,
  rewardStaggerMs: 220,
  rewardCounterMs: 900,
  finalDelayMs: 600,
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    const setInitial = window.setTimeout(() => setReduced(mq.matches), 0);
    mq.addEventListener("change", handler);
    return () => {
      window.clearTimeout(setInitial);
      mq.removeEventListener("change", handler);
    };
  }, []);
  return reduced;
}

export function ReportStage({ report, mission }: ReportStageProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<Stage>("sealed");
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(
    () => report.report.split(/\n+/).map((l) => l.trim()).filter(Boolean),
    [report.report],
  );

  const breakSeal = () => {
    if (stage !== "sealed") return;
    setStage("breaking");
    playSwordSound();
    if (report.success) {
      window.setTimeout(() => playVictorySound(), 320);
    } else {
      window.setTimeout(() => playDefeatSound(), 320);
    }
    const t = window.setTimeout(
      () => setStage("scroll"),
      reduceMotion ? 50 : STAGE_TIMING.sealBreakMs,
    );
    return () => window.clearTimeout(t);
  };

  useEffect(() => {
    if (stage !== "scroll") return;
    const t = window.setTimeout(
      () => setStage("loot"),
      reduceMotion ? 0 : STAGE_TIMING.scrollUnrollMs,
    );
    return () => window.clearTimeout(t);
  }, [stage, reduceMotion]);

  useEffect(() => {
    if (stage !== "loot") return;
    const t = window.setTimeout(
      () => setStage("rewards"),
      reduceMotion ? 0 : STAGE_TIMING.lootRevealMs,
    );
    return () => window.clearTimeout(t);
  }, [stage, reduceMotion]);

  useEffect(() => {
    if (stage !== "rewards") return;
    if (report.success) {
      fireCoinRain(2400);
    } else {
      fireEmberRain(1600);
    }
    const tileCount = 4;
    const total =
      tileCount * STAGE_TIMING.rewardStaggerMs + STAGE_TIMING.rewardCounterMs + STAGE_TIMING.finalDelayMs;
    const t = window.setTimeout(
      () => setStage("done"),
      reduceMotion ? 100 : total,
    );
    return () => window.clearTimeout(t);
  }, [stage, report.success, reduceMotion]);

  const rewardStart = (index: number) =>
    index * STAGE_TIMING.rewardStaggerMs + 100;

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-4xl">
      <SealedEnvelope
        visible={stage === "sealed" || stage === "breaking"}
        breaking={stage === "breaking"}
        victory={report.success}
        reduceMotion={reduceMotion}
        onBreak={breakSeal}
        report={report}
        mission={mission}
      />

      <AnimatePresence>
        {stage !== "sealed" && stage !== "breaking" && (
          <motion.div
            key="scroll-stage"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.4, transformOrigin: "top center" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0.2 : 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="space-y-6"
          >
            <UnrolledScroll
              report={report}
              mission={mission}
              lines={lines}
              stage={stage}
              reduceMotion={reduceMotion}
            />

            <LootAndWounds
              visible={stage === "loot" || stage === "rewards" || stage === "done"}
              report={report}
              reduceMotion={reduceMotion}
            />

            <RewardGrid
              visible={stage === "rewards" || stage === "done"}
              report={report}
              reduceMotion={reduceMotion}
              rewardStart={rewardStart}
            />

            <ActionButtons
              visible={stage === "done"}
              hasWounds={report.wounds.length > 0}
            />

            <FinalFooter visible={stage === "done"} report={report} mission={mission} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SealedEnvelope({
  visible,
  breaking,
  victory,
  reduceMotion,
  onBreak,
  report,
  mission,
}: {
  visible: boolean;
  breaking: boolean;
  victory: boolean;
  reduceMotion: boolean;
  onBreak: () => void;
  report: MissionResult;
  mission: MissionDefinition | undefined;
}) {
  if (!visible) return null;
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[60vh] flex-col items-center justify-center"
    >
      <div className={`sealed-letter ${victory ? "victory" : "defeat"} ${breaking ? "breaking" : ""}`}>
        <div className="sealed-corner tl" />
        <div className="sealed-corner tr" />
        <div className="sealed-corner bl" />
        <div className="sealed-corner br" />

        <div className="sealed-body">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-stone-700/80">
            Tercio VIII · Flandes
          </p>
          <h1 className="font-cinzel text-3xl font-bold uppercase tracking-widest text-stone-900 md:text-4xl">
            Diario de Campaña
          </h1>
          <p className="font-serif text-sm italic text-stone-700">
            {mission?.title ?? report.missionId.replace(/_/g, " ")}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-stone-700/80">
            {new Date(report.createdAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div className="seal-wrap">
            <div className="seal-left">
              <img
                src={victory ? reportAssetPaths.waxSeal : reportAssetPaths.skullDark}
                alt="Sello de cera"
                className="seal-img"
              />
            </div>
            <div className="seal-right">
              <img
                src={victory ? reportAssetPaths.waxSeal : reportAssetPaths.skullDark}
                alt="Sello de cera"
                className="seal-img"
              />
            </div>
            <div className="seal-crack" />
          </div>

          <button
            type="button"
            onClick={onBreak}
            disabled={breaking}
            className={`blood-button mt-2 flex items-center gap-2 ${breaking ? "opacity-70" : ""}`}
            style={{ pointerEvents: breaking ? "none" : "auto" }}
          >
            <Sword className="h-4 w-4" />
            <span>{breaking ? "Rompiendo sello…" : "Romper el sello"}</span>
            {!breaking && <ChevronRight className="h-4 w-4" />}
          </button>

          <p className="font-mono text-[9px] uppercase tracking-widest text-stone-700/70">
            Solo para ojos del Capitán Rodrigo
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function UnrolledScroll({
  report,
  mission,
  lines,
  stage,
  reduceMotion,
}: {
  report: MissionResult;
  mission: MissionDefinition | undefined;
  lines: string[];
  stage: Stage;
  reduceMotion: boolean;
}) {
  const showBody = stage !== "sealed" && stage !== "breaking" && stage !== "scroll";
  return (
    <div className={`parchment-card relative rounded-sm border border-parchment-dark shadow-2xl ${report.success ? "" : "defeat-mode"}`}>
      <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
        <img
          src={reportAssetPaths.scrollQuill}
          alt="Pluma y pergamino"
          className="h-10 w-auto object-contain drop-shadow-md"
        />
      </div>

      <div className="absolute -left-3 top-10 h-10 w-10">
        <img src={reportAssetPaths.cornerTopLeft} alt="" className="h-full w-full object-contain" />
      </div>
      <div className="absolute -right-3 top-10 h-10 w-10">
        <img src={reportAssetPaths.cornerTopRight} alt="" className="h-full w-full object-contain" />
      </div>
      <div className="absolute -left-3 bottom-10 h-10 w-10">
        <img src={reportAssetPaths.cornerBottomLeft} alt="" className="h-full w-full object-contain" />
      </div>
      <div className="absolute -right-3 bottom-10 h-10 w-10">
        <img src={reportAssetPaths.cornerBottomRight} alt="" className="h-full w-full object-contain" />
      </div>

      <div className="relative p-6 md:p-10">
        <div className="border-b border-parchment-dark/40 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-stone-700/80">
            Asunto
          </p>
          <h2 className="font-cinzel text-2xl font-bold uppercase text-stone-900 md:text-3xl">
            {mission?.title ?? report.missionId.replace(/_/g, " ")}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-serif text-xs text-stone-700">
            <span><strong>De:</strong> Sgto. M. Gonzalo de Vargas</span>
            <span className="text-stone-500">·</span>
            <span><strong>Para:</strong> Cap. Rodrigo</span>
            <span className="text-stone-500">·</span>
            <span>
              {new Date(report.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="my-5 flex items-center justify-center">
          <img src={reportAssetPaths.scrollDivider} alt="" className="h-3 w-2/3 object-contain opacity-70" />
        </div>

        <div className="flex justify-center">
          <motion.span
            initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
            animate={showBody ? { scale: 1, opacity: 1, rotate: -2 } : { scale: 0.6, opacity: 0, rotate: -4 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: reduceMotion ? 0 : 0.2 }}
            className={`stamp-badge ${report.success ? "stamp-victory" : "stamp-defeat"}`}
          >
            {report.success ? (
              <>
                <Sword className="h-4 w-4" />
                ¡VICTORIA EN CAMPAÑA!
              </>
            ) : (
              <>
                <Skull className="h-4 w-4" />
                INFORMADA DERROTA
              </>
            )}
          </motion.span>
        </div>

        <div className="mt-6 space-y-3 font-serif text-base leading-relaxed text-stone-850 md:text-lg">
          {lines.map((line, idx) => (
            <motion.p
              key={idx}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(2px)" }}
              animate={
                stage !== "sealed" && stage !== "breaking"
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : { opacity: 0, y: 8 }
              }
              transition={{
                duration: reduceMotion ? 0.2 : 0.6,
                delay: reduceMotion ? 0 : 0.4 + idx * 0.18,
                ease: "easeOut",
              }}
              className="italic first-letter:font-cinzel first-letter:mr-1 first-letter:text-2xl first-letter:font-bold first-letter:text-blood-bright"
            >
              &ldquo;{line}&rdquo;
            </motion.p>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center">
          <img src={reportAssetPaths.ornament} alt="" className="h-3 w-1/2 object-contain opacity-60" />
        </div>
      </div>
    </div>
  );
}

function LootAndWounds({
  visible,
  report,
  reduceMotion,
}: {
  visible: boolean;
  report: MissionResult;
  reduceMotion: boolean;
}) {
  if (!visible) return null;
  const hasWounds = report.wounds.length > 0;
  const hasLoot = report.loot.length > 0;
  if (!hasWounds && !hasLoot) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {hasWounds && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -30, rotate: -1 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: "easeOut" }}
          className="relative overflow-hidden border-2 border-danger/40 bg-gradient-to-br from-stone-900 via-stone-900 to-blood/20 p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-danger/40 bg-black/40">
              <img
                src={reportAssetPaths.woundCare}
                alt="Herida"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="font-cinzel text-[11px] font-bold uppercase tracking-widest text-danger">
                Herida en el asalto
              </p>
              <p className="mt-1 font-serif text-sm text-text">
                {report.wounds
                  .map((wId) => getWound(wId)?.name ?? wId)
                  .join(", ")}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-text-muted">
                <ShieldAlert className="-mt-0.5 mr-1 inline h-3 w-3" />
                Requiere hospital · Penaliza hasta sanar
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {hasLoot && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 30, rotate: 1 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: "easeOut", delay: 0.05 }}
          className="relative overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-stone-900 via-stone-900 to-gold/15 p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-gold/40 bg-black/40">
              <img
                src={reportAssetPaths.rewardCoinBagSmall}
                alt="Botín"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="font-cinzel text-[11px] font-bold uppercase tracking-widest text-gold-soft">
                Botín confiscado
              </p>
              <ul className="mt-1 space-y-0.5 font-serif text-sm text-text">
                {report.loot.map((item, i) => {
                  const def = getItem(item.itemId);
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-gold-soft">x{item.quantity}</span>
                      <span>{def?.name ?? item.itemId}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {report.loot.length > 0 && (
        <div className="md:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Hallado en el campo · Transferido al macuto
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.loot.map((item, i) => {
              const def = getItem(item.itemId);
              return (
                <motion.div
                  key={`${item.itemId}-${i}`}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: reduceMotion ? 0.2 : 0.45,
                    delay: reduceMotion ? 0 : 0.15 + i * 0.08,
                    type: "spring",
                    stiffness: 220,
                    damping: 16,
                  }}
                  className="loot-chip"
                >
                  <img
                    src={getItemImagePath(item.itemId)}
                    alt={def?.name ?? item.itemId}
                    className="h-8 w-8 object-contain"
                  />
                  <div className="leading-tight">
                    <p className="font-cinzel text-[11px] font-bold text-gold-soft">
                      {def?.name ?? item.itemId}
                    </p>
                    <p className="font-mono text-[10px] text-text-muted">x{item.quantity}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RewardGrid({
  visible,
  report,
  reduceMotion,
  rewardStart,
}: {
  visible: boolean;
  report: MissionResult;
  reduceMotion: boolean;
  rewardStart: (index: number) => number;
}) {
  if (!visible) return null;
  const tiles = [
    {
      icon: reportAssetPaths.rewardCoinBag,
      label: "Doblones",
      value: report.rewards.coins,
      tone: "gold" as const,
      sign: "+" as const,
    },
    {
      icon: reportAssetPaths.rewardSun,
      label: "Experiencia",
      value: report.rewards.xp,
      tone: "xp" as const,
      sign: "+" as const,
    },
    {
      icon: reportAssetPaths.rewardHonor,
      label: "Honor",
      value: report.rewards.honor,
      tone: "honor" as const,
      sign: "+" as const,
    },
    {
      icon: reportAssetPaths.rewardHourglass,
      label: "Fatiga",
      value: report.fatigue,
      tone: "ember" as const,
      sign: "+" as const,
    },
  ];

  return (
    <div className="game-panel relative overflow-hidden rounded-xs border border-iron p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={uiIconPaths.coins} alt="" className="h-7 w-7" />
          <h3 className="font-cinzel text-sm font-bold uppercase tracking-widest text-gold-soft">
            {report.success ? "Botín de la jornada" : "Consecuencias de la derrota"}
          </h3>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
          {report.success ? "Cuenta del Sargento" : "Cuenta del Cirujano"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile, i) => (
          <RewardTile
            key={tile.label}
            icon={tile.icon}
            label={tile.label}
            value={tile.value}
            tone={tile.tone}
            delay={i * STAGE_TIMING.rewardStaggerMs}
            startAt={rewardStart(i)}
            sign={tile.sign}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <img src={reportAssetPaths.banner} alt="" className="h-5 w-5 opacity-70" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {report.success
            ? "Saldo total abonado en el macuto del tercio."
            : "Nada de esto se devolverá. Anotado en la libreta del capitán."}
        </p>
      </div>
    </div>
  );
}

function ActionButtons({ visible, hasWounds }: { visible: boolean; hasWounds: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <Link
        href="/missions"
        className="iron-button flex flex-1 items-center justify-center gap-2 text-xs"
      >
        <ArrowRight className="h-4 w-4" />
        Volver a Campana
      </Link>

      {hasWounds && (
        <Link
          href="/hospital"
          onClick={() => playDrumSound()}
          className="blood-button flex flex-1 animate-pulse items-center justify-center gap-2 text-xs"
        >
          <HeartPulse className="h-4 w-4" />
          Tratar Heridas en Hospital
        </Link>
      )}
    </motion.div>
  );
}

function FinalFooter({
  visible,
  report,
  mission,
}: {
  visible: boolean;
  report: MissionResult;
  mission: MissionDefinition | undefined;
}) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="game-panel mt-2 flex items-center justify-between gap-4 border border-iron p-4"
    >
      <div className="flex items-center gap-3">
        <img src={uiIconPaths.confirm} alt="" className="h-8 w-8 opacity-80" />
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Firmado y sellado
          </p>
          <p className="font-cinzel text-xs font-bold text-gold-soft">
            J. de Aldana · Escribano del Tercio
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Asiento en el libro
        </p>
        <p className="font-serif text-[11px] italic text-text">
          {mission?.title ?? report.missionId.replace(/_/g, " ")}
        </p>
      </div>
    </motion.div>
  );
}
