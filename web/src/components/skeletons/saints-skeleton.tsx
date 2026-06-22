// SaintsSkeleton: layout-mirroring placeholder for /saints.
// Mirrors the header with honor/coin tiles, the four-tab strip,
// and the first tab (long missions) with three parchment rows.

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function Header() {
  return (
    <header
      aria-hidden="true"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3"
    >
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-12 w-12" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </header>
  );
}

function Tabs() {
  return (
    <div
      aria-hidden="true"
      className="flex overflow-hidden rounded-xs border border-iron/70 bg-panel-soft/20"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-12 flex-1 rounded-none" />
      ))}
    </div>
  );
}

function MissionRow() {
  return (
    <div
      aria-hidden="true"
      className="grid min-h-20 grid-cols-[54px_1fr_42px] gap-2 border border-iron/50 bg-stone-900/50 p-2"
    >
      <SkeletonCircle className="h-11 w-11" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
      <Skeleton className="h-full w-full" />
    </div>
  );
}

export function SaintsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Header />
      <Tabs />
      <section
        aria-hidden="true"
        className="game-panel space-y-3 rounded-xs border border-iron p-3 md:p-4"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <MissionRow key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
