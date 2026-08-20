import clsx from "clsx";
export function Card({ children, className, hover=false }: { children:React.ReactNode; className?:string; hover?:boolean }) {
  return (
    <div className={clsx("rounded-[10px] border border-border bg-surface p-5 transition-all duration-200",
      hover && "hover:border-accent/30 hover:bg-surface-hover hover:shadow-sm cursor-pointer", className)}>
      {children}
    </div>
  );
}
