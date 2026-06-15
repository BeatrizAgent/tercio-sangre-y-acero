"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { playCoinSound, playSwordSound } from "@/lib/sounds";

export type RewardTone = "gold" | "xp" | "honor" | "ember";

interface RewardTileProps {
  icon: string;
  label: string;
  value: number;
  tone: RewardTone;
  delay: number;
  startAt: number;
  sign?: "+" | "-";
  reduceMotion?: boolean;
}

const toneStyles: Record<RewardTone, { glow: string; value: string; pip: string }> = {
  gold: { glow: "rgba(247, 210, 131, 0.55)", value: "text-gold-soft", pip: "bg-gold" },
  xp: { glow: "rgba(231, 200, 120, 0.45)", value: "text-[#f7d283]", pip: "bg-[#f7d283]" },
  honor: { glow: "rgba(212, 167, 76, 0.5)", value: "text-[#ffd47a]", pip: "bg-[#ffd47a]" },
  ember: { glow: "rgba(184, 50, 50, 0.5)", value: "text-danger", pip: "bg-danger" },
};

function useCountUp(target: number, startAt: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    const begin = window.setTimeout(() => {
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const elapsed = now - t0;
        const p = Math.min(1, elapsed / durationMs);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    }, startAt);
    return () => window.clearTimeout(begin);
  }, [target, startAt, durationMs]);
  return value;
}

export function RewardTile({
  icon,
  label,
  value,
  tone,
  delay,
  startAt,
  sign = "+",
  reduceMotion = false,
}: RewardTileProps) {
  const shown = useCountUp(value, startAt, reduceMotion ? 1 : 900);
  const style = toneStyles[tone];

  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setTimeout(() => playCoinSound(), startAt + 850);
    return () => window.clearTimeout(t);
  }, [startAt, reduceMotion]);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85, rotate: -3 }}
      animate={
        reduceMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
              scale: [0.85, 1.12, 1],
              rotate: [-3, 1, 0],
            }
      }
      transition={{
        duration: reduceMotion ? 0.2 : 0.65,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={() => playSwordSound()}
      className="reward-tile group relative flex flex-col items-center justify-end overflow-hidden cursor-pointer"
      style={{ ["--tile-glow" as string]: style.glow }}
    >
      <div className="relative z-10 flex flex-col items-center gap-1 px-2 py-4 text-center">
        <div className="reward-icon-frame">
          <img src={icon} alt={label} className="h-14 w-14 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
          {label}
        </span>
        <span
          className={`reward-counter font-cinzel font-bold tabular-nums leading-none ${style.value}`}
          style={{ textShadow: `0 0 14px ${style.glow}` }}
        >
          {sign}
          {shown}
        </span>
        <span className={`mt-0.5 h-1 w-8 rounded-full ${style.pip} opacity-80`} />
      </div>

      <div className="reward-tile-shine pointer-events-none absolute inset-0" />
    </motion.div>
  );
}
