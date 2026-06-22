// ChurchSkeleton: same shape as the armory (header + npc-offer
// frame + two-chest layout) but tailored to the chapel chrome
// (4-tab chaplain chest + player backpack).

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function Header() {
  return (
    <header
      aria-hidden="true"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3"
    >
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-12 w-12" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-2.5 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-28" />
      </div>
    </header>
  );
}

function NpcOfferFrame() {
  return (
    <div
      aria-hidden="true"
      className="game-panel relative overflow-hidden rounded-xs border border-iron p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <SkeletonCircle className="h-14 w-14" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-24" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChestPanel({ tabs, cells }: { tabs: number; cells: number }) {
  return (
    <section
      aria-hidden="true"
      className="game-panel min-w-0 w-full max-w-full overflow-hidden space-y-2 p-3"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-iron/45 pb-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <div className="flex flex-wrap gap-1 border-b border-iron/40 pb-2">
        {Array.from({ length: tabs }, (_, index) => (
          <Skeleton key={index} className="h-6 w-20" />
        ))}
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(8, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cells }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </section>
  );
}

export function ChurchSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Header />
      <NpcOfferFrame />
      <div className="grid min-w-0 max-w-full gap-4 overflow-hidden xl:grid-cols-2">
        <ChestPanel tabs={4} cells={32} />
        <ChestPanel tabs={1} cells={40} />
      </div>
    </div>
  );
}
