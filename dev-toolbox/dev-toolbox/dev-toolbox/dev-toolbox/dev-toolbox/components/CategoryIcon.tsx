import { ToolCategory } from "@/lib/types";

interface IconProps {
  className?: string;
  size?: number;
}

// Minimal, geometric SVG icons — Lucide-style line icons
const icons: Record<string, (p: IconProps) => JSX.Element> = {
  formatting: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  encoding: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <rect x="1" y="5" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="10" y="5" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6 8h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  text: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M3 3h10M8 3v10M5 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  hash: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M6 2L4.5 14M11.5 2L10 14M2.5 6h11M2 10h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  generators: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  datetime: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  web: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 8h12M8 2c-1.5 2-2.5 3.5-2.5 6s1 4 2.5 6M8 2c1.5 2 2.5 3.5 2.5 6s-1 4-2.5 6" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  data: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <ellipse cx="8" cy="4.5" rx="5" ry="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M3 4.5v3c0 1.1 2.24 2 5 2s5-.9 5-2v-3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M3 7.5v3c0 1.1 2.24 2 5 2s5-.9 5-2v-3" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  qa: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M2.5 8.5l3 3 8-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  api: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M5 4l-3 4 3 4M11 4l3 4-3 4M9 2l-2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export function CategoryIcon({
  category,
  className = "",
  size = 16,
}: {
  category: ToolCategory | string;
  className?: string;
  size?: number;
}) {
  const Icon = icons[category];
  if (!Icon) return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
  return <Icon className={className} size={size} />;
}
