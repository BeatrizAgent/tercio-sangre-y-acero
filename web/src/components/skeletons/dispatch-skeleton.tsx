// Dispatch skeletons: shared by /mailbox, /news, /packages — all
// three render a title bar + a single game-panel card with a
// short list of rows.

import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

export function TitleBar({ title, iconSize = 56 }: { title: string; iconSize?: number }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-4 border-b border-iron pb-3"
    >
      <SkeletonCircle className="h-14 w-14" style={{ height: iconSize, width: iconSize }} />
      <Skeleton className="h-8 w-44" />
    </div>
  );
}

export function CardShell({ rowCount = 3 }: { rowCount?: number }) {
  return (
    <section
      aria-hidden="true"
      className="game-panel space-y-3 rounded-xs border border-iron p-5"
    >
      <Skeleton className="h-5 w-56" />
      <div className="space-y-3">
        {Array.from({ length: rowCount }, (_, index) => (
          <div key={index} className="flex items-start gap-3 border border-iron bg-panel/45 p-4">
            <SkeletonCircle className="h-9 w-9" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DispatchSkeleton({
  title,
  rowCount = 3,
}: {
  title: string;
  rowCount?: number;
}) {
  return (
    <div className="space-y-6" aria-busy="true">
      <TitleBar title={title} />
      <CardShell rowCount={rowCount} />
    </div>
  );
}
