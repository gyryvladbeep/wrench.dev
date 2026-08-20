import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
type Variant = "primary"|"secondary"|"ghost"|"danger";
type Size    = "xs"|"sm"|"md"|"lg";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?:Variant; size?:Size; }
const V: Record<Variant,string> = {
  primary:   "bg-accent text-accent-fg border border-transparent hover:bg-accent/90 active:scale-[.98]",
  secondary: "bg-surface text-text-primary border border-border hover:bg-surface-hover active:scale-[.98]",
  ghost:     "bg-transparent text-text-muted border border-transparent hover:bg-surface hover:text-text-primary active:scale-[.98]",
  danger:    "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-[.98]",
};
const S: Record<Size,string> = { xs:"px-2 py-0.5 text-xs gap-1", sm:"px-2.5 py-1.5 text-xs gap-1.5", md:"px-4 py-2 text-sm gap-2", lg:"px-5 py-2.5 text-sm gap-2" };
export const Button = forwardRef<HTMLButtonElement,ButtonProps>(({ className, variant="primary", size="md", ...props }, ref) => (
  <button ref={ref}
    className={clsx("inline-flex items-center justify-center rounded-[10px] font-medium transition-all duration-150",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
      V[variant], S[size], className)} {...props} />
));
Button.displayName = "Button";
