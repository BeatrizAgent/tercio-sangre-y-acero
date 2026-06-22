"use client";

import React from "react";

interface GladiatusBarProps {
  value: number;
  max: number;
  type: "hp" | "xp" | "fatigue";
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function GladiatusBar({
  value,
  max,
  type,
  label,
  showPercentage = false,
  className = "",
}: GladiatusBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  
  // Fill gradient class depending on the type
  const fillClass = 
    type === "hp" 
      ? "gladiatus-bar-fill-hp" 
      : type === "xp" 
      ? "gladiatus-bar-fill-xp" 
      : "gladiatus-bar-fill-fatigue";

  return (
    <div 
      className={`gladiatus-bar-container w-full ${className}`}
      title={`${label || type.toUpperCase()}: ${value}/${max}`}
    >
      <div 
        className={`gladiatus-bar-fill ${fillClass}`}
        style={{ width: `${percentage}%` }}
      />
      <div className="gladiatus-bar-text">
        {label ? `${label}: ` : ""}
        {value} / {max}
        {showPercentage && ` (${Math.round(percentage)}%)`}
      </div>
    </div>
  );
}
