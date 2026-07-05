import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[10px] border border-border bg-surface p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
