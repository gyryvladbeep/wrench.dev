import Link from "next/link";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-text-primary">
            <span className="font-mono text-accent">{`>_`}</span>
            Dev Toolbox
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-text-primary">{title}</h1>
        </div>
        <div className="rounded-[10px] border border-border bg-surface p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
