// Skeleton: tiny primitive for layout-mirroring loading placeholders.
// Backed by `.skeleton-shimmer` in globals.css; degrades to a static
// iron-toned block under `prefers-reduced-motion`. The default
// `role="status"` + visually-hidden "Cargando..." string announces the
// loading state to assistive tech; individual `Skeleton` instances
// should be wrapped in an `aria-busy="true"` parent (the page or
// `useGameData` consumer) to opt out of the announcement once data lands.
//
// Composable: pass any className (sizing, borders, radius). Pages
// compose these to mirror their real layout — see components/skeletons/.

import type { HTMLAttributes } from "react";

function SrOnlyCargando() {
  return <span className="sr-only">Cargando...</span>;
}

export function Skeleton({
  className = "",
  decorative = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { decorative?: boolean }) {
  return (
    <div
      role={decorative ? undefined : "status"}
      aria-hidden={decorative ? true : undefined}
      aria-live={decorative ? undefined : "polite"}
      className={`skeleton-shimmer rounded-xs ${className}`}
      {...rest}
    >
      {decorative ? null : <SrOnlyCargando />}
    </div>
  );
}

export function SkeletonCircle({
  className = "",
  decorative = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { decorative?: boolean }) {
  return (
    <Skeleton
      className={`rounded-full ${className}`}
      decorative={decorative}
      {...rest}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
  lastLineWidth = 60,
  decorative = true,
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: number;
  decorative?: boolean;
}) {
  const safeLines = Math.max(1, lines);
  return (
    <div
      role={decorative ? undefined : "status"}
      aria-hidden={decorative ? true : undefined}
      aria-live={decorative ? undefined : "polite"}
      className={`flex w-full flex-col gap-1.5 ${className}`}
    >
      {Array.from({ length: safeLines }, (_, index) => {
        const isLast = index === safeLines - 1;
        return (
          <div
            key={index}
            className="skeleton-shimmer h-2.5 rounded-xs"
            style={isLast && safeLines > 1 ? { width: `${lastLineWidth}%` } : undefined}
          />
        );
      })}
      {decorative ? null : <SrOnlyCargando />}
    </div>
  );
}
