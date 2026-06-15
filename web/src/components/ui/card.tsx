"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "motion/react";
import { playSwordSound, playDrumSound } from "@/lib/sounds";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";

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
      <h2 className="section-title mb-4 flex items-center gap-3 font-cinzel text-xl tracking-wider text-gold-soft border-b border-iron pb-1.5 font-bold uppercase">
        {iconId && <UiAssetIcon id={iconId} label="" className="h-11 w-11" />}
        <span>{title}</span>
      </h2>
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "gold" | "danger" | "success" }) {
  const styles = {
    default: "border-stone-850 bg-stone-900/60 text-text-muted",
    gold: "border-gold/30 bg-gold/10 text-gold-soft",
    danger: "border-danger/30 bg-danger/10 text-danger",
    success: "border-success/30 bg-success/10 text-success",
  };

  return (
    <span className={`border px-3 py-1 text-sm font-mono font-bold rounded-xs ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function SubmitButton({ 
  children, 
  testId, 
  variant = "blood",
  disabled = false,
  onClick
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
      whileHover={!disabled ? { scale: 1.02, border: "1px solid var(--gold)" } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`${btnClass} text-xs md:text-sm cursor-pointer`}
      data-testid={testId}
    >
      {children}
    </motion.button>
  );
}
