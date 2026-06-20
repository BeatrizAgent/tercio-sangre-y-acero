// ResourceChip / QuickAction: small status pills used in the top command
// bar (game-shell.tsx). Extracted here so the company/, soldier/, and other
// screens can reuse the same component for things like "fatigue remaining",
// "honor total", or "actions per day".
//
// The component does not call playPageSound itself; consumers wire that
// through onClick (keeps ui/ free of game-layer dependencies).

"use client";

import Link from "next/link";
import { UiAssetIcon } from "./ui-asset-icon";
import type { ComponentProps } from "react";

type UiIconId = ComponentProps<typeof UiAssetIcon>["id"];

export function ResourceChip({
  icon,
  label,
  value,
  tone = "text-text-muted",
  compact = false,
  className = "",
}: {
  icon: UiIconId;
  label: string;
  value: string | number;
  tone?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      title={`${label}: ${value}`}
      className={`gladiatus-resource-chip min-w-0 ${
        compact ? "px-1 py-0.5 gap-0.5" : "px-1.5 py-0.5 gap-1"
      } ${className}`}
    >
      <UiAssetIcon
        id={icon}
        label={label}
        className={`shrink-0 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-sans text-[9px] font-bold uppercase tracking-[0.04em] text-text-muted">
          {label}
        </span>
        <span className={`truncate font-mono text-[11px] font-extrabold ${tone}`}>{value}</span>
      </div>
    </div>
  );
}

export function QuickAction({
  href,
  icon,
  label,
  value,
  max,
  tone = "text-gold",
  onNavigate,
  className = "",
}: {
  href: string;
  icon: UiIconId;
  label: string;
  value: number;
  max: number;
  tone?: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const barColor = tone.startsWith("text-") ? tone.replace("text-", "bg-") : "bg-gold";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`gladiatus-resource-chip group min-w-0 cursor-pointer flex-row items-center gap-1 px-1.5 py-1 transition-all hover:border-gold/45 hover:bg-black/40 ${className}`}
      title={`${label}: ${value}/${max}`}
    >
      <UiAssetIcon
        id={icon}
        label={label}
        className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105"
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-sans text-[10px] font-bold uppercase tracking-[0.04em] text-text-muted group-hover:text-gold-soft">
          {label}
        </span>
        <span className={`truncate font-mono text-xs font-extrabold leading-tight ${tone}`}>
          {value}/{max}
        </span>
      </div>
      <div
        className="ml-auto h-1 w-8 shrink-0 overflow-hidden rounded-full bg-black/60 ring-1 ring-inset ring-iron/40"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label} restantes`}
      >
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </Link>
  );
}
