"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "motion/react";
import { playSwordSound, playDrumSound } from "@/lib/sounds";
import { UiAssetIcon } from "./ui-asset-icon";

export function Card({
  title,
  children,
  className = "",
  iconId,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  iconId?: ComponentProps<typeof UiAssetIcon>["id"];
}) {
  return (
    <section className={`game-panel p-5 rounded-xs ${className}`}>
      <h2 className="section-title mb-4 flex items-center gap-3 text-gold-soft">
        {iconId && <UiAssetIcon id={iconId} label="" className="h-11 w-11" />}
        <span>{title}</span>
      </h2>
      <div className="relative z-10">{children}</div>
    </section>
  );
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  default: "border-iron/70 bg-stone-900/60 text-text-muted",
  gold: "border-gold/35 bg-gold/10 text-gold-soft",
  danger: "border-danger/35 bg-danger/10 text-danger",
  success: "border-success/35 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
};

type BadgeVariant = "default" | "gold" | "danger" | "success" | "warning";

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors ${BADGE_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SubmitButton({
  children,
  testId,
  variant = "blood",
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  testId?: string;
  variant?: "blood" | "iron";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const btnClass = variant === "blood" ? "blood-button" : "iron-button";

  const handleClick = () => {
    if (disabled) return;
    if (variant === "blood") {
      playDrumSound();
    } else {
      playSwordSound();
    }
    if (onClick) onClick();
  };

  return (
    <motion.button
      type={onClick ? "button" : "submit"}
      onClick={handleClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`${btnClass} text-xs md:text-sm cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}
      data-testid={testId}
    >
      {children}
    </motion.button>
  );
}
