// ReportsSkeleton: layout-mirroring placeholder for /reports.
// Mirrors the title bar and the list of report cards.

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

function TitleBar() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-4 border-b border-iron pb-3"
    >
      <SkeletonCircle className="h-14 w-14" />
      <Skeleton className="h-8 w-40" />
    </div>
  );
}

function ReportRow() {
  return (
    <div
      aria-hidden="true"
      className="block border border-iron bg-panel/45 p-4"
    >
      <div className="flex items-start gap-3">
        <SkeletonCircle className="h-10 w-10" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

function CardShell() {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron p-5"
    >
      <Skeleton className="h-5 w-56" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <ReportRow key={index} />
        ))}
      </div>
    </section>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <TitleBar />
      <CardShell />
    </div>
  );
}
