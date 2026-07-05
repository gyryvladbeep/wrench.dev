import clsx from "clsx";

type BadgeVariant = "popular" | "pro" | "soon" | "default";

const variantClasses: Record<BadgeVariant, string> = {
  popular: "bg-accent/15 text-accent border border-accent/30",
  pro: "bg-link/15 text-link border border-link/30",
  soon: "bg-surface text-text-muted border border-border",
  default: "bg-surface text-text-muted border border-border",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant]
      )}
    >
      {children}
    </span>
  );
}
