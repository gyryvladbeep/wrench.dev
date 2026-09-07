import Link from "next/link";
import { GameIcon, ClipboardIcon, BookIcon } from "@/components/icons/GameIcons";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {/* ASCII art wrench */}
      <div className="mb-6 font-mono text-xs text-text-muted leading-tight select-none opacity-30">
        <pre>{`
     ___
    /   \\
   | 404 |
    \\___/
      |
    __|__
   /     \\
  |  NOT  |
  | FOUND |
   \\_____/
        `}</pre>
      </div>

      {/* Animated number */}
      <div className="relative mb-4">
        <p className="text-[100px] font-black leading-none select-none"
          style={{ color: "var(--accent)", opacity: 0.15 }}>404</p>
        <div className="absolute inset-0 flex items-center justify-center animate-float">
          <GameIcon id="wrench" size={64} />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-text-primary">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-text-muted leading-relaxed">
        Looks like this page got lost in the toolbox. Let&apos;s get you back on track.
      </p>

      {/* Suggestions */}
      <div className="mt-8 grid grid-cols-2 gap-2 text-left max-w-sm w-full">
        {[
          { href:"/tools",      icon:(p:{size?:number}) => <GameIcon id="wrench" size={p.size} />, label:"All Tools" },
          { href:"/challenges", icon:(p:{size?:number}) => <GameIcon id="trophy" size={p.size} />, label:"Challenges" },
          { href:"/interview",  icon:ClipboardIcon,                                                label:"Interview Prep" },
          { href:"/knowledge",  icon:BookIcon,                                                     label:"Knowledge Base" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-muted hover:bg-surface-hover hover:text-text-primary hover:border-[var(--accent)]/30 transition-all">
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-accent-fg transition-all hover:opacity-90"
          style={{ background: "var(--accent)" }}>
          Go home
        </Link>
      </div>
    </div>
  );
}