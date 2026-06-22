// EmptyState: single source of truth for "no data here" panels.
// Promoted out of /recruitment so every page can show a coherent
// empty panel with an icon, title, and an optional CTA. Mirrors the
// dark/iron + gold-soft accent of the rest of the chrome.

import type { ReactNode } from "react";
import { UiAssetIcon } from "./ui-asset-icon";
import type { ComponentProps } from "react";

type UiIconId = ComponentProps<typeof UiAssetIcon>["id"];

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: UiIconId;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`game-panel flex flex-col items-center gap-3 rounded-xs border border-iron/70 bg-stone-950/55 p-8 text-center ${className}`}
    >
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-xs border border-gold/30 bg-black/40 text-gold-soft">
          <UiAssetIcon id={icon} label={title} className="h-7 w-7" />
        </span>
      )}
      <p className="font-cinzel text-base font-bold uppercase tracking-wider text-gold-soft">
        {title}
      </p>
      {description && (
        <p className="max-w-md text-sm text-text-muted">{description}</p>
      )}
      {action}
    </div>
  );
}
