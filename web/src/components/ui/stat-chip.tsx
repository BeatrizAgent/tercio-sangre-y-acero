// StatChip: small inline chip showing a label/value pair with an optional
// tone. Replaces the StatLine, StatBar, Metric, and inline stat-chip blocks
// in soldier/page.tsx, game-shell.tsx, tercio-formation-view.tsx, and
// stripe-card.tsx.

"use client";

import React from "react";
import { Tooltip } from "./tooltip";
import type { StatId } from "@/lib/types";

export type StatTone = "default" | "gold" | "success" | "danger" | "ember" | "stone";

const TONE_CLASS: Record<StatTone, string> = {
  default: "border-iron/70 bg-stone-950/60 text-text-muted",
  gold: "border-gold/45 bg-gold/10 text-gold-soft",
  success: "border-success/40 bg-success/12 text-success",
  danger: "border-danger/40 bg-danger/12 text-danger",
  ember: "border-ember/45 bg-ember/12 text-ember",
  stone: "border-stone-700/70 bg-stone-900/55 text-amber-100/85",
};

export function StatChip({
  statId,
  label,
  value,
  tone = "default",
  compact = false,
  className = "",
}: {
  statId?: StatId;
  label?: string;
  value: string | number;
  tone?: StatTone;
  compact?: boolean;
  className?: string;
}) {
  const content = (
    <span
      className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 font-mono ${
        compact ? "text-[10px]" : "text-[11px]"
      } font-bold ${TONE_CLASS[tone]} ${className}`}
    >
      {label && (
        <span className={`${compact ? "text-[8px]" : "text-[9px]"} uppercase text-text-muted`}>
          {label}
        </span>
      )}
      <span className={tone === "gold" || tone === "ember" || tone === "stone" ? "" : "text-text"}>
        {value}
      </span>
    </span>
  );
  if (statId) {
    return <Tooltip type="stat" statId={statId}>{content}</Tooltip>;
  }
  return content;
}

// FatigueBar: progress bar with the canonical agotado/cansado/fresco
// thresholds used in stripe-card.tsx and stripe-token.tsx.
export function fatigueTone(value: number): StatTone {
  if (value > 75) return "danger";
  if (value > 40) return "ember";
  return "success";
}

export function fatigueLabel(value: number): "agotado" | "cansado" | "fresco" {
  if (value > 75) return "agotado";
  if (value > 40) return "cansado";
  return "fresco";
}

export function FatigueBar({
  value,
  showLabel = true,
  ariaLabel = "Fatiga",
  className = "",
}: {
  value: number;
  showLabel?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const tone = fatigueTone(value);
  const barClass =
    tone === "danger" ? "bg-danger" : tone === "ember" ? "bg-ember" : "bg-success";
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60 ring-1 ring-inset ring-iron/40"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div className={`h-full ${barClass} transition-all duration-300`} style={{ width }} />
      </div>
      {showLabel && (
        <span className="shrink-0 font-mono text-[9px] text-text-muted">
          {value} · {fatigueLabel(value)}
        </span>
      )}
    </div>
  );
}
