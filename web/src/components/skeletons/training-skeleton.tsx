// TrainingSkeleton: layout-mirroring placeholder for /training.
// Mirrors the active-recruit tab row, the seven stat rows
// (icon + name + value + progress + cost + action), and the
// status side card.

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function Header() {
  return (
    <header
      aria-hidden="true"
      className="flex flex-wrap items-end justify-between gap-3 border-b border-iron pb-3"
    >
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="h-6 w-44" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-32" />
      </div>
    </header>
  );
}

function ActiveRecruitTabs() {
  return (
    <section
      aria-hidden="true"
      className="game-panel rounded-xs border border-iron bg-stone-950/70 p-3"
    >
      <div className="mb-2 flex items-center justify-between border-b border-iron/50 pb-2">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-20 items-center gap-2 rounded-xs border border-iron bg-stone-900/55 p-2"
          >
            <SkeletonCircle className="h-14 w-12" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatRow() {
  return (
    <article
      aria-hidden="true"
      className="grid gap-3 bg-background/38 p-3 lg:grid-cols-[70px_minmax(150px,1fr)_72px_110px_92px_112px] lg:items-center"
    >
      <SkeletonCircle className="h-16 w-16" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2 w-20" />
        <Skeleton className="h-2 w-48" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-2 w-12" />
          <Skeleton className="h-2 w-8" />
        </div>
        <Skeleton className="h-2.5 w-full" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-10 w-full" />
    </article>
  );
}

function StatTable() {
  return (
    <div
      aria-hidden="true"
      className="game-panel overflow-hidden rounded-xs border border-iron bg-linear-to-b from-stone-900/85 to-stone-950/90 shadow-inner"
    >
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="divide-y divide-iron/70">
        {Array.from({ length: 7 }, (_, index) => (
          <StatRow key={index} />
        ))}
      </div>
    </div>
  );
}

function StatusCard() {
  return (
    <aside
      aria-hidden="true"
      className="game-panel space-y-4 rounded-xs border border-iron bg-stone-950/65 p-4"
    >
      <Skeleton className="h-3 w-32" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="border border-iron bg-stone-950/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </aside>
  );
}

export function TrainingSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Header />
      <ActiveRecruitTabs />
      <StatTable />
      <StatusCard />
    </div>
  );
}
