"use client";

import type React from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";

type IconId = React.ComponentProps<typeof UiAssetIcon>["id"];

export interface OfferAction {
  id: string;
  iconId?: IconId;
  imageSrc?: string;
  label: string;
  value?: string | number;
  disabled?: boolean;
  tooltip?: string;
  onClick?: () => void;
}

export interface NpcVisualModel {
  id: string;
  title: string;
  subtitle?: string;
  portraitSrc: string;
  sceneSrc?: string;
  offers: OfferAction[];
  primaryAction?: OfferAction;
}

export function VisualOfferGrid({
  offers,
  columns = "grid-cols-4",
  itemClassName = "",
}: {
  offers: OfferAction[];
  columns?: string;
  itemClassName?: string;
}) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {offers.map((offer) => {
        const content = (
          <button
            type="button"
            disabled={offer.disabled || !offer.onClick}
            onClick={offer.onClick}
            aria-label={offer.label}
            className={`group relative flex min-h-16 flex-col items-center justify-center gap-1 overflow-hidden rounded-xs border border-iron bg-stone-950/55 p-2 transition hover:border-gold/45 disabled:cursor-not-allowed disabled:opacity-45 ${itemClassName}`}
          >
            {offer.imageSrc ? (
              <img src={offer.imageSrc} alt="" className="h-10 w-10 object-contain drop-shadow-md" draggable={false} />
            ) : offer.iconId ? (
              <UiAssetIcon id={offer.iconId} label={offer.label} className="h-9 w-9" />
            ) : null}
            {offer.value !== undefined && (
              <span className="max-w-full truncate font-mono text-[11px] font-bold leading-none text-gold-soft">
                {offer.value}
              </span>
            )}
            <span className="sr-only">{offer.label}</span>
          </button>
        );

        return (
          <Tooltip key={offer.id} type="simple" content={offer.tooltip ?? offer.label}>
            {content}
          </Tooltip>
        );
      })}
    </div>
  );
}

export function NpcOfferFrame({
  model,
  children,
  className = "",
}: {
  model: NpcVisualModel;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`game-panel overflow-hidden p-0 ${className}`}>
      <div className="relative min-h-[340px] bg-stone-950">
        {model.sceneSrc && (
          <img
            src={model.sceneSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45 scene-image-realism"
            draggable={false}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/70 to-background/30" />
        <div className="relative z-10 grid min-h-[340px] gap-3 p-3 md:grid-cols-[210px_minmax(0,1fr)] md:p-4">
          <div className="scene-frame relative overflow-hidden rounded-xs bg-stone-950">
            <img
              src={model.portraitSrc}
              alt={model.title}
              className="h-full min-h-72 w-full object-cover object-top portrait-realism"
              draggable={false}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div className="flex min-w-0 flex-col justify-end gap-3">
            <div className="max-w-xl">
              {model.subtitle && (
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gold-soft/80">
                  {model.subtitle}
                </p>
              )}
              <h2 className="mt-1 truncate font-cinzel text-2xl font-extrabold uppercase tracking-wider text-gold md:text-3xl">
                {model.title}
              </h2>
            </div>
            <VisualOfferGrid offers={model.offers} />
            {children}
            {model.primaryAction && (
              <button
                type="button"
                disabled={model.primaryAction.disabled}
                onClick={model.primaryAction.onClick}
                className="blood-button inline-flex min-h-12 items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-40"
              >
                {model.primaryAction.iconId && <UiAssetIcon id={model.primaryAction.iconId} label="" className="h-5 w-5" />}
                {model.primaryAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
