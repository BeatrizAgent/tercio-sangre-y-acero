// HospitalSkeleton: layout-mirroring placeholder for /hospital.
// Mirrors the title bar, the wounds card with 3 wound rows, and
// the rest card with a single action button.

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function TitleBar() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 border-b border-iron pb-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <Skeleton className="h-7 w-72" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

function WoundsCard() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-4 rounded-xs border border-iron p-5"
    >
      <Skeleton className="h-5 w-32" />
      <div className="divide-y divide-iron">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SkeletonCircle className="h-4 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-2.5 w-44" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RestCard() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron p-5"
    >
      <Skeleton className="h-5 w-24" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
    </section>
  );
}

export function HospitalSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-5" aria-busy="true">
      <TitleBar />
      <WoundsCard />
      <RestCard />
    </div>
  );
}
