import clsx from "clsx";
export function Skeleton({ className }: { className?:string }) {
  return <div className={clsx("animate-pulse rounded-[8px] bg-surface-hover", className)} />;
}
export function ToolCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2 mb-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-14 rounded-full" /></div>
      <Skeleton className="h-3.5 w-full mb-1.5" /><Skeleton className="h-3.5 w-3/4" />
    </div>
  );
}
