// MissionDetailSkeleton: layout-mirroring placeholder for /missions/[id].
// Mirrors the briefing header, the boss panel with the scene and
// stat tiles, and the loot drop grid.

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function Header() {
  return (
    <header
      aria-hidden="true"
      className="flex items-center gap-3 border-b border-iron pb-3"
    >
      <SkeletonCircle className="h-11 w-11" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-2.5 w-44" />
      </div>
    </header>
  );
}

function ScenePanel() {
  return (
    <section
      aria-hidden="true"
      className="game-panel relative overflow-hidden rounded-xs border border-iron"
    >
      <Skeleton className="h-72 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <SkeletonCircle className="h-16 w-16" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}

function BriefingCard() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron p-5"
    >
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-11/12" />
      <Skeleton className="h-3 w-2/3" />
    </section>
  );
}

function LootCard() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron p-5"
    >
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {Array.from({ length: 12 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </section>
  );
}

function ActionRow() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-40" />
    </div>
  );
}

export function MissionDetailSkeleton() {
  return (
    <div className="relative mx-auto max-w-3xl space-y-5" aria-busy="true">
      <Header />
      <ScenePanel />
      <BriefingCard />
      <LootCard />
      <ActionRow />
    </div>
  );
}
