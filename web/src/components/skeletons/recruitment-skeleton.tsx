// RecruitmentSkeleton: layout-mirroring placeholder for /recruitment.
// Mirrors the hero strip, the filter chip row, and the 6-card
// candidate grid (2x3 at the typical lg breakpoint). Used while
// useGameData().status is not "ready".
//
// The candidate card uses the same `.recruit-card` class as the real
// card, so the same container-query rules collapse it to a centered
// portrait+ribbon at narrow widths. That way there is no layout shift
// when the real cards replace these placeholders.

import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/skeleton";

function HeroStrip() {
  return (
    <section
      aria-hidden="true"
      className="scene-frame relative overflow-hidden rounded-xs border border-iron bg-stone-950"
    >
      <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/65 to-background/35" />
      <div className="relative z-10 grid gap-3 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <div className="flex items-center gap-3">
          <SkeletonCircle className="h-12 w-12" />
          <div className="space-y-2">
            <Skeleton className="h-2 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-2 w-64" />
          </div>
        </div>
        <div className="hidden md:block" />
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-12 w-20" />
          </div>
          <Skeleton className="h-6 w-36" />
        </div>
      </div>
    </section>
  );
}

function FiltersRow() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-wrap items-center gap-2 border-b border-iron/60 pb-3"
    >
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-7 w-20" />
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-7 w-32" />
      </div>
    </div>
  );
}

function CandidateCard() {
  return (
    <div
      aria-hidden="true"
      className="recruit-card game-panel flex flex-col gap-2 rounded-xs border border-iron/70 bg-stone-950/65 p-2.5"
    >
      <div className="recruit-card__compact">
        <SkeletonCircle className="recruit-card__portrait h-24 w-24" />
        <div className="recruit-card__name-ribbon">
          <Skeleton className="mx-auto h-3 w-24" />
          <Skeleton className="mx-auto mt-1.5 h-2 w-16" />
        </div>
      </div>
      <div className="recruit-card__body flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <SkeletonCircle className="h-12 w-12" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-20" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-iron/50 pt-2">
          <SkeletonText lines={1} className="w-32" lastLineWidth={80} />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
    </div>
  );
}

export function RecruitmentSkeleton() {
  return (
    <div className="space-y-4">
      <HeroStrip />
      <FiltersRow />
      <section
        className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3"
        style={{ containIntrinsicSize: "auto 1200px" }}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <CandidateCard key={index} />
        ))}
      </section>
    </div>
  );
}
