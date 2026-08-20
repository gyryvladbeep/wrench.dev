import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, localePath } from "@/lib/i18n/config";

export default function NotFound() {
  const dict = getDictionary(defaultLocale);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-8xl font-bold text-border select-none">404</p>
      <h1 className="mt-6 text-xl font-semibold text-text-primary">Page not found</h1>
      <p className="mt-2 max-w-xs text-sm text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent/90 transition-colors">
          Go home
        </Link>
        <Link href="/tools" className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:bg-surface-hover transition-colors">
          Browse tools
        </Link>
      </div>
    </div>
  );
}
