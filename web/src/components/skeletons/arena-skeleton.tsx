// ArenaSkeleton: layout-mirroring placeholder for /arena.
// Mirrors the title bar, the stat strip, the rival card, and the
// side cards (ranking + last duels).

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function Header() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3"
    >
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-9 w-9" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3 w-80" />
        </div>
      </div>
      <Skeleton className="h-6 w-32" />
    </div>
  );
}

function StatStrip() {
  return (
    <div
      aria-hidden="true"
      className="game-panel grid gap-2 p-3 md:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex min-h-16 items-center gap-2 p-2">
          <SkeletonCircle className="h-8 w-8" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RivalCard() {
  return (
    <section
      aria-hidden="true"
      className="game-panel overflow-hidden p-4"
    >
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        <Skeleton className="h-56 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-3/4" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    </section>
  );
}

export function RivalCardSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="game-panel overflow-hidden p-0"
    >
      <div className="grid gap-3 p-3 md:grid-cols-[220px_minmax(0,1fr)] md:p-4">
        <div className="scene-frame relative h-64 w-full overflow-hidden rounded-xs border border-iron bg-stone-950 md:h-full">
          <Skeleton className="absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background/95 to-transparent" />
        </div>
        <div className="flex min-w-0 flex-col justify-end gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
          <Skeleton className="h-12 w-36" />
        </div>
      </div>
    </section>
  );
}

export function RivalCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="space-y-3"
    >
      <span className="sr-only">Cargando rivales de la arena...</span>
      {Array.from({ length: count }, (_, index) => (
        <RivalCardSkeleton key={index} />
      ))}
    </div>
  );
}

function SideCard() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron p-5"
    >
      <Skeleton className="h-5 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 border border-iron bg-background/45 p-2">
            <SkeletonCircle className="h-7 w-7" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ArenaSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Header />
      <StatStrip />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <RivalCard />
        <div className="space-y-5">
          <SideCard />
          <SideCard />
        </div>
      </div>
    </div>
  );
}
