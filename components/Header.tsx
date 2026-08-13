"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";
import { useAuth } from "@/lib/auth/auth-context";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { SearchModal } from "@/components/SearchModal";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const active   = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link href={href} className={`text-sm transition-colors duration-150 ${
      active ? "text-text-primary font-medium" : "text-text-muted hover:text-text-primary"
    }`}>{children}</Link>
  );
}

function UserMenu() {
  const { locale, dict } = useDict();
  const { user, signOut } = useAuth();
  const router = useRouter();
  async function handleSignOut() { await signOut(); router.push(localePath(locale, "/")); router.refresh(); }

  if (!user) return (
    <div className="flex items-center gap-2">
      <Link href={localePath(locale, "/auth/login")} className="text-sm text-text-muted hover:text-text-primary transition-colors">{dict.auth.signIn}</Link>
      <Link href={localePath(locale, "/auth/signup")} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent/90 transition-colors">{dict.auth.signUp}</Link>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <Link href={localePath(locale, "/profile")}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent hover:bg-accent/25 transition-colors"
        title={user.email ?? ""}>{(user.email ?? "?")[0].toUpperCase()}</Link>
      <button onClick={handleSignOut} className="text-sm text-text-muted hover:text-text-primary transition-colors">{dict.auth.signOut}</button>
    </div>
  );
}

// Search icon SVG
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export function Header() {
  const { locale, dict } = useDict();
  const nav    = dict.nav;
  const home   = localePath(locale, "/");
  const isRu   = locale === "ru";
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-40 border-b transition-all duration-150 ${
        scrolled ? "border-border/80 bg-canvas/98 shadow-[0_1px_0_rgba(255,255,255,.04)]" : "border-border/50 bg-canvas/95"
      } backdrop-blur-md`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 h-14">
          {/* Logo */}
          <Link href={home} className="flex items-center gap-2 shrink-0 hover:opacity-75 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-accent"/>
              <path d="M5 9h8M9 5v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent"/>
            </svg>
            <span className="font-semibold text-sm text-text-primary tracking-tight">Wrench-Branch</span>
          </Link>

          {/* Search — desktop */}
          <button onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 max-w-[280px] items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:border-border/80 hover:text-text-primary transition-all">
            <SearchIcon />
            <span className="flex-1 text-left">{isRu ? "Поиск инструментов…" : "Search tools…"}</span>
            <kbd className="rounded border border-border bg-canvas px-1.5 py-px font-mono text-[10px]">⌘K</kbd>
          </button>

          {/* Nav — desktop */}
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
            <NavLink href={localePath(locale, "/tools")}>{nav.tools}</NavLink>
            <NavLink href={localePath(locale, "/categories/formatting")}>{nav.categories}</NavLink>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(true)} aria-label={isRu ? "Поиск" : "Search"}
              className="md:hidden rounded-md p-1.5 text-text-muted hover:bg-surface hover:text-text-primary transition-colors">
              <SearchIcon />
            </button>
            <LocaleSwitcher />
            <UserMenu />
          </div>
        </div>
      </header>
      <SearchModal locale={locale} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
