// ReportDetailSkeleton: layout-mirroring placeholder for /reports/[id].
// Mirrors the sealed-letter stage and the reward tile grid that the
// report-stage.tsx component renders after the combat resolver
// animation finishes.

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function SealedLetter() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-[520px] rounded-xs border border-iron bg-stone-950 p-8"
    >
      <div className="flex flex-col items-center gap-3">
        <SkeletonCircle className="h-32 w-32" />
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-3 w-32" />
        <div className="mt-4 w-full space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

function RewardTile() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col items-center gap-2 rounded-xs border border-iron bg-stone-950 p-4"
    >
      <SkeletonCircle className="h-14 w-14" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  );
}

function RewardGrid() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron p-5"
    >
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <RewardTile key={index} />
        ))}
      </div>
    </section>
  );
}

function ActionBar() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-44" />
    </div>
  );
}

export function ReportDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <SealedLetter />
      <RewardGrid />
      <ActionBar />
    </div>
  );
}
