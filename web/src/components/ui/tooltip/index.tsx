"use client";

import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import type { StatId } from "@/lib/types";
import { SimpleTooltipContent } from "./content-simple";

const ItemTooltipContent = lazy(() =>
  import("./content-item").then((module) => ({ default: module.ItemTooltipContent })),
);
const StatTooltipContent = lazy(() =>
  import("./content-stat").then((module) => ({ default: module.StatTooltipContent })),
);
const WoundTooltipContent = lazy(() =>
  import("./content-wound").then((module) => ({ default: module.WoundTooltipContent })),
);

export type TooltipType = "simple" | "item" | "stat" | "wound";

interface TooltipProps {
  children?: React.ReactNode;
  type?: TooltipType;
  content?: string;
  itemId?: string;
  statId?: StatId;
  woundId?: string;
  treated?: boolean;
  fill?: boolean;
}

type Side = "top" | "bottom" | "left" | "right";

function pickSide(rect: DOMRect, popoverW: number, popoverH: number, margin: number): Side {
  const spaces: Record<Side, number> = {
    top: rect.top,
    bottom: window.innerHeight - rect.bottom,
    left: rect.left,
    right: window.innerWidth - rect.right,
  };
  const fits = {
    top: spaces.top >= popoverH + margin,
    bottom: spaces.bottom >= popoverH + margin,
    left: spaces.left >= popoverW + margin,
    right: spaces.right >= popoverW + margin,
  };

  if (fits.bottom) return "bottom";
  if (fits.top) return "top";
  if (fits.right) return "right";
  if (fits.left) return "left";

  return (Object.entries(spaces).sort((a, b) => b[1] - a[1])[0]?.[0] as Side) ?? "bottom";
}

interface PopoverPosition {
  top: number;
  left: number;
  side: Side;
}

function estimatePopoverSize(type: TooltipType): { width: number; height: number } {
  switch (type) {
    case "item":
      return { width: 288, height: 560 };
    case "stat":
      return { width: 220, height: 180 };
    case "wound":
      return { width: 288, height: 220 };
    default:
      return { width: 210, height: 90 };
  }
}

function computePopoverPosition(rect: DOMRect, popoverW: number, popoverH: number): PopoverPosition {
  const margin = 12;
  const side = pickSide(rect, popoverW, popoverH, margin);
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let top: number;
  let left: number;

  if (side === "top") {
    top = rect.top - popoverH - margin;
    left = cx - popoverW / 2;
  } else if (side === "bottom") {
    top = rect.bottom + margin;
    left = cx - popoverW / 2;
  } else if (side === "right") {
    top = cy - popoverH / 2;
    left = rect.right + margin;
  } else {
    top = cy - popoverH / 2;
    left = rect.left - popoverW - margin;
  }

  const maxLeft = window.innerWidth - popoverW - margin;
  const maxTop = window.innerHeight - popoverH - margin;
  left = Math.max(margin, Math.min(left, Math.max(margin, maxLeft)));
  top = Math.max(margin, Math.min(top, Math.max(margin, maxTop)));

  return { side, top, left };
}

function TooltipArrow({ side }: { side: Side }) {
  const borderClass = "w-0 h-0 border-[6px] border-transparent";
  if (side === "top") {
    return (
      <div
        style={{ position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)" }}
        className="w-0 h-0"
      >
        <div className={`${borderClass} border-t-gold/45 -mb-px`} />
        <div className={`${borderClass} border-t-stone-950/95`} />
      </div>
    );
  }
  if (side === "bottom") {
    return (
      <div
        style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)" }}
        className="w-0 h-0"
      >
        <div className={`${borderClass} border-b-gold/45 -mb-px`} />
        <div className={`${borderClass} border-b-stone-950/95`} />
      </div>
    );
  }
  if (side === "left") {
    return (
      <div
        style={{ position: "absolute", right: -1, top: "50%", transform: "translateY(-50%)" }}
        className="w-0 h-0"
      >
        <div className={`${borderClass} border-l-gold/45 -mr-px`} />
        <div className={`${borderClass} border-l-stone-950/95`} />
      </div>
    );
  }
  return (
    <div
      style={{ position: "absolute", left: -1, top: "50%", transform: "translateY(-50%)" }}
      className="w-0 h-0"
    >
      <div className={`${borderClass} border-r-gold/45 -ml-px`} />
      <div className={`${borderClass} border-r-stone-950/95`} />
    </div>
  );
}

function TooltipBody({ type, content, itemId, statId, woundId, treated }: Omit<TooltipProps, "children">) {
  const fallback = <SimpleTooltipContent content="Cargando..." />;
  switch (type) {
    case "item":
      return (
        <Suspense fallback={fallback}>
          <ItemTooltipContent itemId={itemId} />
        </Suspense>
      );
    case "stat":
      return (
        <Suspense fallback={fallback}>
          <StatTooltipContent statId={statId} />
        </Suspense>
      );
    case "wound":
      return (
        <Suspense fallback={fallback}>
          <WoundTooltipContent woundId={woundId} treated={treated} />
        </Suspense>
      );
    default:
      return <SimpleTooltipContent content={content ?? ""} />;
  }
}

export function Tooltip({
  children,
  type = "simple",
  content = "",
  itemId,
  statId,
  woundId,
  treated = false,
  fill = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>({ top: 0, left: 0, side: "top" });
  const [positioned, setPositioned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const container = containerRef.current;
    const popover = popoverRef.current;
    if (!container || !popover) return false;
    let rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      const child = container.firstElementChild as HTMLElement | null;
      if (child) {
        const childRect = child.getBoundingClientRect();
        if (childRect.width > 0 && childRect.height > 0) {
          rect = childRect;
        }
      }
    }
    if (rect.width <= 0 || rect.height <= 0) return false;
    const popW = popover.offsetWidth || 288;
    const popH = popover.offsetHeight || 200;
    if (popW <= 0 || popH <= 0) return false;
    setPosition(computePopoverPosition(rect, popW, popH));
    setPositioned(true);
    return true;
  };

  const showTooltip = () => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const estimate = estimatePopoverSize(type);
        setPosition(computePopoverPosition(rect, estimate.width, estimate.height));
        setPositioned(true);
      } else {
        setPositioned(false);
      }
    } else {
      setPositioned(false);
    }
    setVisible(true);
  };

  const handleMouseEnter = () => {
    showTooltip();
  };

  const hideTooltip = () => {
    setVisible(false);
    setPositioned(false);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    const nextTarget = e.relatedTarget as Node | null;
    if (nextTarget && popoverRef.current?.contains(nextTarget)) return;
    hideTooltip();
  };

  const handlePopoverMouseLeave = () => {
    hideTooltip();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" && !visible) {
      e.stopPropagation();
      e.preventDefault();
      showTooltip();
    }
  };

  useLayoutEffect(() => {
    if (!visible) return;
    const settled = updatePosition();
    let raf = 0;
    if (!settled) {
      raf = requestAnimationFrame(() => updatePosition());
    }
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handleOutsideClick = (e: PointerEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setVisible(false);
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [visible]);

  const popover = (
    <div
      ref={popoverRef}
      data-tooltip-popover
      style={{
        position: "fixed",
        top: positioned ? position.top : -10000,
        left: positioned ? position.left : -10000,
        zIndex: 9999,
        visibility: positioned ? "visible" : "hidden",
      }}
      className="tooltip-popover pointer-events-auto bg-stone-950/95 backdrop-blur-md border border-gold/45 text-text rounded-xs shadow-2xl"
      onMouseLeave={handlePopoverMouseLeave}
    >
      <TooltipBody
        type={type}
        content={content}
        itemId={itemId}
        statId={statId}
        woundId={woundId}
        treated={treated}
      />
      <TooltipArrow side={position.side} />
    </div>
  );

  if (!children) {
    return (
      <div
        ref={containerRef}
        className="relative inline-flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          className="rounded-xs p-0.5 text-gold-soft/60 transition-colors hover:text-gold focus:outline-hidden focus-visible:ring-1 focus-visible:ring-gold/60 cursor-help"
          aria-label="Informacion"
        >
          <Info className="h-4 w-4" />
        </button>
        {visible && createPortal(popover, document.body)}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-tooltip-root
      className={fill ? "relative inline-block h-full w-full" : "relative inline-flex max-w-full align-middle"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
    >
      {children}
      {visible && createPortal(popover, document.body)}
    </div>
  );
}
