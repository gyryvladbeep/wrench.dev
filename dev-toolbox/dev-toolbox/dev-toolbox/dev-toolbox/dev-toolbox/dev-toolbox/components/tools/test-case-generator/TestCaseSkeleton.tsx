"use client";
import { Skeleton } from "@/components/ui/Skeleton";

export function TestCaseSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
      </div>
      <div className="code-surface rounded-[10px] p-4 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-20" />
            <div className="pl-4 space-y-1.5 mt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-3 w-3/4 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
