// MissionsSkeleton: layout-mirroring placeholder for /missions.
// Mirrors the header, world-map region grid, and the region panel with its
// boss list. Mode selection lives in the sidebar.

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function Header() {
  return (
    <header
      aria-hidden="true"
      className="flex items-center justify-between gap-3 border-b border-iron pb-3"
    >
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-12 w-12" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-2.5 w-44" />
        </div>
      </div>
      <SkeletonCircle className="h-8 w-8" />
    </header>
  );
}

function WorldMapView() {
  return (
    <section
      aria-hidden="true"
      className="game-panel relative aspect-[16/10] w-full overflow-hidden rounded-xs border border-iron bg-stone-950 p-2 shadow-inner"
    >
      <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      {[
        { x: "20%", y: "30%" },
        { x: "45%", y: "55%" },
        { x: "70%", y: "25%" },
        { x: "30%", y: "70%" },
        { x: "60%", y: "65%" },
      ].map((dot, index) => (
        <SkeletonCircle
          key={index}
          className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 md:h-16 md:w-16"
          style={{ left: dot.x, top: dot.y }}
        />
      ))}
    </section>
  );
}

function BossRow() {
  return (
    <div
      aria-hidden="true"
      className="game-panel flex items-center gap-3 rounded-xs border bg-stone-950/80 p-3"
    >
      <SkeletonCircle className="h-12 w-12" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-28" />
      </div>
      <Skeleton className="h-7 w-20" />
    </div>
  );
}

function RegionPanelView() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-20" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <BossRow key={index} />
        ))}
      </div>
    </div>
  );
}

export function MissionsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Header />
      <WorldMapView />
      <RegionPanelView />
    </div>
  );
}
