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
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        isActive ? "text-text-primary font-medium" : "text-text-muted hover:text-text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

function UserMenu() {
  const { locale, dict } = useDict();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const t = dict.auth;

  async function handleSignOut() {
    await signOut();
    router.push(localePath(locale, "/"));
    router.refresh();
  }

  if (!user) return (
    <div className="flex items-center gap-2">
      <Link
        href={localePath(locale, "/auth/login")}
        className="text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        {t.signIn}
      </Link>
      <Link
        href={localePath(locale, "/auth/signup")}
        className="rounded-[10px] bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent/90 transition-colors"
      >
        {t.signUp}
      </Link>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <Link
        href={localePath(locale, "/profile")}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent hover:bg-accent/30 transition-colors"
        title={user.email ?? ""}
      >
        {(user.email ?? "?")[0].toUpperCase()}
      </Link>
      <button
        onClick={handleSignOut}
        className="text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        {t.signOut}
      </button>
    </div>
  );
}

export function Header() {
  const { locale, dict } = useDict();
  const nav = dict.nav;
  const home = localePath(locale, "/");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isRu = locale === "ru";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-200 ${
          scrolled
            ? "border-border bg-canvas/98 shadow-sm backdrop-blur-md"
            : "border-border/60 bg-canvas/95 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">

          {/* Logo */}
          <Link href={home} className="flex items-center gap-2 font-semibold text-text-primary shrink-0 hover:opacity-80 transition-opacity">
            <span className="font-mono text-accent">{`>_`}</span>
            <span className="hidden sm:inline">Wrench</span>
          </Link>

          {/* Search bar — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 max-w-xs items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 text-sm text-text-muted hover:border-accent/40 hover:text-text-primary transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="flex-1 text-left">{isRu ? "Поиск…" : "Search…"}</span>
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>

          {/* Nav */}
          <nav className="hidden items-center gap-5 lg:flex">
            <NavLink href={localePath(locale, "/tools")}>{nav.tools}</NavLink>
            <NavLink href={localePath(locale, "/categories/formatting")}>{nav.categories}</NavLink>
            <Link href={`${home}#ai`} className="text-sm text-text-muted hover:text-text-primary transition-colors">
              {nav.ai} <span className="text-xs text-accent">{nav.aiSoon}</span>
            </Link>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Mobile search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden rounded-[8px] p-1.5 text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
              aria-label={isRu ? "Поиск" : "Search"}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
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
