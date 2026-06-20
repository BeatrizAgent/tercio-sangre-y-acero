"use client";

import React, { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { StatId } from "@/lib/types";
import { ItemTooltipContent } from "./content-item";
import { SimpleTooltipContent } from "./content-simple";
import { StatTooltipContent } from "./content-stat";
import { WoundTooltipContent } from "./content-wound";

export type TooltipType = "simple" | "item" | "stat" | "wound";

interface TooltipProps {
  children?: React.ReactNode;
  type?: TooltipType;
  content?: string;
  itemId?: string;
  statId?: StatId;
  woundId?: string;
  treated?: boolean;
}

type Side = "top" | "bottom" | "left" | "right";

const POSITION_CLASSES: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
  left: "right-full top-1/2 -translate-y-1/2 mr-3",
  right: "left-full top-1/2 -translate-y-1/2 ml-3",
};

function pickSide(rect: DOMRect): Side {
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceLeft = rect.left;
  const spaceRight = window.innerWidth - rect.right;
  if (spaceAbove > 340) return "top";
  if (spaceBelow > 340) return "bottom";
  if (spaceRight > 320) return "right";
  return "left";
}

function TooltipArrow({ side }: { side: Side }) {
  const borderClass = "border-4 border-transparent";
  if (side === "top") {
    return (
      <>
        <div className={`${borderClass} border-t-gold/45 absolute top-full left-1/2 -translate-x-1/2`} />
        <div className={`${borderClass} border-t-stone-950 absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]`} />
      </>
    );
  }
  if (side === "bottom") {
    return (
      <>
        <div className={`${borderClass} border-b-gold/45 absolute bottom-full left-1/2 -translate-x-1/2`} />
        <div className={`${borderClass} border-b-stone-950 absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px]`} />
      </>
    );
  }
  if (side === "left") {
    return (
      <>
        <div className={`${borderClass} border-l-gold/45 absolute left-full top-1/2 -translate-y-1/2`} />
        <div className={`${borderClass} border-l-stone-950 absolute left-full top-1/2 -translate-y-1/2 -ml-[1px]`} />
      </>
    );
  }
  return (
    <>
      <div className={`${borderClass} border-r-gold/45 absolute right-full top-1/2 -translate-y-1/2`} />
      <div className={`${borderClass} border-r-stone-950 absolute right-full top-1/2 -translate-y-1/2 -mr-[1px]`} />
    </>
  );
}

function TooltipBody({ type, content, itemId, statId, woundId, treated }: Omit<TooltipProps, "children">) {
  switch (type) {
    case "item":
      return <ItemTooltipContent itemId={itemId} />;
    case "stat":
      return <StatTooltipContent statId={statId} />;
    case "wound":
      return <WoundTooltipContent woundId={woundId} treated={treated} />;
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
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [side, setSide] = useState<Side>("top");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      setSide(pickSide(containerRef.current.getBoundingClientRect()));
    }
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" && !visible) {
      e.stopPropagation();
      e.preventDefault();
      handleMouseEnter();
    }
  };

  useEffect(() => {
    if (!visible) return;
    const handleOutsideClick = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [visible]);

  const popover = (
    <div
      className={`absolute z-50 bg-stone-950/98 backdrop-blur-md border border-gold/45 text-text rounded-xs shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 ${POSITION_CLASSES[side]}`}
    >
      <TooltipBody
        type={type}
        content={content}
        itemId={itemId}
        statId={statId}
        woundId={woundId}
        treated={treated}
      />
      <TooltipArrow side={side} />
    </div>
  );

  if (!children) {
    return (
      <div
        className="relative inline-flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          className="text-gold-soft/50 hover:text-gold transition-colors cursor-help p-0.5 focus:outline-hidden"
          aria-label="Informaci\u00f3n"
        >
          <Info className="h-4 w-4" />
        </button>
        {visible && popover}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
    >
      {children}
      {visible && popover}
    </div>
  );
}
