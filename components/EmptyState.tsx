import Link from "next/link";

interface EmptyStateProps {
  icon?:        string;
  title:        string;
  description?: string;
  action?:      { label: string; href: string };
}

export function EmptyState({ icon = "🔍", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-4">
        <div className="text-5xl animate-float">{icon}</div>
        <div className="absolute inset-0 rounded-full blur-xl opacity-20"
          style={{ background: "var(--accent)" }} />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 max-w-xs text-sm text-text-muted leading-relaxed">{description}</p>
      )}
      {action && (
        <Link href={action.href}
          className="mt-5 rounded-lg px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:opacity-90"
          style={{ background: "var(--accent)" }}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function EmptyToolInput({ message = "Paste your input to see the result" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mb-2 text-text-muted" aria-hidden>
        <rect x="4" y="8" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 14h12M10 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p className="text-xs text-text-muted">{message}</p>
    </div>
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">🔎</span>
      <h3 className="text-base font-semibold text-text-primary">No results for &ldquo;{query}&rdquo;</h3>
      <p className="mt-2 text-sm text-text-muted">Try a different search term or browse by category.</p>
    </div>
  );
}
export function EmptySearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">🔎</span>
      <h3 className="text-base font-semibold text-text-primary">No results for &ldquo;{query}&rdquo;</h3>
      <p className="mt-2 text-sm text-text-muted">Try a different search term or browse by category.</p>
    </div>
  );
}