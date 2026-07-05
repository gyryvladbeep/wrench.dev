"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";
import { useAuth } from "@/lib/auth/auth-context";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { SearchModal } from "@/components/SearchModal";

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
      <Link href={localePath(locale, "/auth/login")} className="text-sm text-text-muted hover:text-text-primary">
        {t.signIn}
      </Link>
      <Link href={localePath(locale, "/auth/signup")} className="rounded-[10px] bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent/90">
        {t.signUp}
      </Link>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <Link
        href={localePath(locale, "/profile")}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-accent hover:bg-accent/30"
        title={user.email ?? ""}
      >
        {(user.email ?? "?")[0].toUpperCase()}
      </Link>
      <button onClick={handleSignOut} className="text-sm text-text-muted hover:text-text-primary">
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

  const isRu = locale === "ru";
  const searchLabel = isRu ? "Поиск" : "Search";

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">

          {/* Logo */}
          <Link href={home} className="flex items-center gap-2 font-semibold text-text-primary shrink-0">
            <span className="font-mono text-accent">{`>_`}</span>
            Dev Toolbox
          </Link>

          {/* Search bar — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 max-w-sm items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 text-sm text-text-muted hover:border-accent/50 hover:text-text-primary transition-colors"
          >
            <span>⌕</span>
            <span className="flex-1 text-left">{searchLabel}…</span>
            <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">⌘K</kbd>
          </button>

          {/* Nav links — desktop */}
          <nav className="hidden items-center gap-5 text-sm text-text-muted lg:flex">
            <Link href={localePath(locale, "/tools")} className="hover:text-text-primary">{nav.tools}</Link>
            <Link href={localePath(locale, "/categories/formatting")} className="hover:text-text-primary">{nav.categories}</Link>
            <Link href={`${home}#ai`} className="hover:text-text-primary">
              {nav.ai} <span className="text-xs text-accent">{nav.aiSoon}</span>
            </Link>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Mobile search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden text-text-muted hover:text-text-primary"
              aria-label={searchLabel}
            >
              ⌕
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
