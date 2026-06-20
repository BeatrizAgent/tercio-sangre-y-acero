"use client";

// Simple tooltip body: just a single line of italic copy.

export function SimpleTooltipContent({ content }: { content: string }) {
  return (
    <div className="w-52 p-3 font-serif italic text-left text-text leading-relaxed">
      &quot;{content}&quot;
    </div>
  );
}
