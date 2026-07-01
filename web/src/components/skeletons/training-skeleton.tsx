// TrainingSkeleton: layout-mirroring placeholder for /training.
// Mirrors the new per-stat card grid (icon, name, level, bonus block,
// cost row, dual action buttons), the recruit switcher row, and the
// right sidebar (status tiles + fatigue impact + recommendations).

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
        <Skeleton className="h-3 w-72" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-7 w-20" />
      </div>
    </header>
  );
}

function RecruitSwitcher() {
  return (
    <section
      aria-hidden="true"
      className="game-panel rounded-xs border border-iron bg-stone-950/70 p-3"
    >
      <div className="mb-2 flex items-center justify-between border-b border-iron/50 pb-2">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-20 items-center gap-2 rounded-xs border border-iron bg-stone-900/55 p-2"
          >
            <SkeletonCircle className="h-12 w-12" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-24" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SceneHeader() {
  return (
    <div
      aria-hidden="true"
      className="game-panel relative overflow-hidden rounded-xs border border-iron bg-stone-900/70 shadow-inner"
    >
      <div className="flex min-h-32 items-center gap-3 p-4">
        <SkeletonCircle className="h-12 w-12" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      </div>
    </div>
  );
}

function StatCard() {
  return (
    <article
      aria-hidden="true"
      className="game-panel flex flex-col gap-3 rounded-xs border border-iron bg-stone-950/60 p-4"
    >
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-14 w-14" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="h-2 w-44" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-2 w-8" />
          <Skeleton className="h-6 w-10" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-2 w-12" />
          <Skeleton className="h-2 w-12" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="border border-iron/60 bg-stone-950/55 p-2.5 space-y-1.5">
        <Skeleton className="h-2 w-16" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2.5 w-12" />
        </div>
        <Skeleton className="h-2.5 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full sm:w-28" />
      </div>
    </article>
  );
}

function StatCardGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 7 }, (_, index) => (
        <StatCard key={index} />
      ))}
    </div>
  );
}

function StatusCard() {
  return (
    <aside
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron bg-stone-950/65 p-4"
    >
      <Skeleton className="h-3 w-40" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="border border-iron bg-stone-950/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </aside>
  );
}

function RecommendationCard() {
  return (
    <aside
      aria-hidden="true"
      className="game-panel space-y-2 rounded-xs border border-iron bg-stone-950/65 p-4"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-xs border border-iron/50 bg-stone-900/40 p-2"
          >
            <SkeletonCircle className="h-8 w-8" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function TrainingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Header />
      <RecruitSwitcher />
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <SceneHeader />
          <StatCardGrid />
        </div>
        <aside className="space-y-4">
          <StatusCard />
          <RecommendationCard />
        </aside>
      </div>
    </div>
  );
}
