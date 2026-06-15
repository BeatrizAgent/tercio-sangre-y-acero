"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

export function Tooltip({ content }: { content: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button 
        type="button" 
        className="text-gold-soft/50 hover:text-gold transition-colors cursor-help p-0.5 focus:outline-hidden"
        onClick={() => setVisible(!visible)}
        onBlur={() => setVisible(false)}
        aria-label="Información"
      >
        <Info className="h-4 w-4" />
      </button>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-stone-950 border border-gold/45 text-[11px] font-sans text-text-muted rounded-xs shadow-2xl z-50 pointer-events-none leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="relative z-10 font-serif italic text-left text-text">
            "{content}"
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gold/45" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-950 -mt-[1px]" />
        </div>
      )}
    </div>
  );
}
