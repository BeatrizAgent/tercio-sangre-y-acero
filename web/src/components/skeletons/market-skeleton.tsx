import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function MarketSkeleton() {
  return (
    <div className="space-y-4">
      <div className="page-header">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <SkeletonText className="h-3 w-32" />
          <SkeletonText className="h-7 w-44" />
        </div>
      </div>
      <div className="game-panel space-y-3 p-3">
        <SkeletonText className="h-5 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="game-panel space-y-2 p-3">
        <SkeletonText className="h-5 w-36" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
