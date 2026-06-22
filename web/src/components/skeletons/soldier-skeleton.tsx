// SoldierSkeleton: layout-mirroring placeholder for /soldier.
// Mirrors the profile-tab row, the hero portrait block with name
// and rank, the stats grid, the equipment mannequin, and the
// inventory chest.

import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/skeleton";

function ProfileTabs() {
  return (
    <div
      aria-hidden="true"
      className="game-panel flex flex-wrap items-center gap-2 rounded-xs border border-iron bg-stone-950/55 p-2"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-2 rounded-xs border border-iron bg-stone-900/55 p-2">
          <SkeletonCircle className="h-12 w-10" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroBlock() {
  return (
    <section
      aria-hidden="true"
      className="game-panel grid gap-4 rounded-xs border border-iron bg-stone-950/65 p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-44 w-36 rounded-xs" />
        <div className="space-y-1 text-center">
          <Skeleton className="mx-auto h-3 w-28" />
          <Skeleton className="mx-auto h-2 w-20" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-56" />
        </div>
        <SkeletonText lines={3} className="max-w-md" lastLineWidth={70} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="border border-iron bg-stone-950/60 p-2">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="mt-1 h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-16 w-40" />
        <Skeleton className="h-12 w-40" />
      </div>
    </section>
  );
}

function StatsBlock() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron bg-stone-950/65 p-4"
    >
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </section>
  );
}

function MannequinBlock() {
  return (
    <section
      aria-hidden="true"
      className="game-panel flex flex-col items-center gap-3 rounded-xs border border-iron bg-stone-950/65 p-4"
    >
      <Skeleton className="h-3 w-24" />
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-14 rounded-xs" />
        ))}
      </div>
      <Skeleton className="h-40 w-32" />
    </section>
  );
}

function InventoryBlock() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron bg-stone-950/65 p-4"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}
      >
        {Array.from({ length: 40 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </section>
  );
}

export function SoldierSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <ProfileTabs />
      <HeroBlock />
      <div className="grid gap-4 lg:grid-cols-3">
        <StatsBlock />
        <MannequinBlock />
        <InventoryBlock />
      </div>
    </div>
  );
}
