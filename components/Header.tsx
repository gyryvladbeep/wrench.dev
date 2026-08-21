"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";
import { useAuth } from "@/lib/auth/auth-context";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { SearchModal } from "@/components/SearchModal";

const LOGO = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <rect x="1.5" y="1.5" width="17" height="17" rx="3.5" stroke="currentColor" strokeWidth="1.5" className="text-accent"/>
    <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="text-accent"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const active   = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link href={href} className={`text-sm transition-colors duration-100 ${
      active ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
    }`}>{children}</Link>
  );
}

function UserMenu() {
  const { locale, dict } = useDict();
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push(localePath(locale, "/"));
    router.refresh();
  }

  if (!user) return (
    <div className="flex items-center gap-2">
      <Link href={localePath(locale, "/auth/login")}
        className="text-xs text-text-muted hover:text-text-secondary transition-colors">
        {dict.auth.signIn}
      </Link>
      <Link href={localePath(locale, "/auth/signup")}
        className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:bg-amber-400 transition-colors">
        {dict.auth.signUp}
      </Link>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <Link href={localePath(locale, "/profile")}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent hover:bg-accent/25 transition-colors"
        title={user.email ?? ""}>
        {(user.email ?? "?")[0].toUpperCase()}
      </Link>
      <button onClick={handleSignOut} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
        {dict.auth.signOut}
      </button>
    </div>
  );
}

export function Header() {
  const { locale, dict } = useDict();
  const isRu   = locale === "ru";
  const home   = localePath(locale, "/");
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-40 border-b transition-colors duration-150 ${
        scrolled ? "border-border bg-canvas/98 backdrop-blur-md" : "border-border/50 bg-canvas/95 backdrop-blur"
      }`}>
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-5">

          <Link href={home} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <LOGO />
            <span className="text-sm font-semibold text-text-primary tracking-tight">Wrench</span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
            <NavLink href={localePath(locale, "/tools")}>{dict.nav.tools}</NavLink>
            <NavLink href={localePath(locale, "/categories/qa")}>QA</NavLink>
            <NavLink href={localePath(locale, "/categories/api")}>API</NavLink>
            <NavLink href={localePath(locale, "/categories/encoding")}>{isRu ? "Кодирование" : "Encoding"}</NavLink>
            <NavLink href={localePath(locale, "/challenges")}>
              <span className="flex items-center gap-1">
                {isRu ? "Челленджи" : "Challenges"}
                <span className="rounded bg-accent/20 px-1 py-px text-[9px] font-bold text-accent uppercase">New</span>
              </span>
            </NavLink>
            <NavLink href={localePath(locale, "/interview")}>
              {isRu ? "Интервью" : "Interview"}
            </NavLink>
            <NavLink href={localePath(locale, "/playground")}>
              Playground
            </NavLink>
            <NavLink href={localePath(locale, "/knowledge")}>
              {isRu ? "База знаний" : "Knowledge"}
            </NavLink>
            <NavLink href={localePath(locale, "/pro")}>
              <span className="flex items-center gap-1">
                Pro
                <span className="rounded bg-violet-500/20 px-1 py-px text-[9px] font-bold text-violet-400 uppercase">$5</span>
              </span>
            </NavLink>
          </nav>

          <button onClick={() => setOpen(true)}
            className="hidden md:flex flex-1 max-w-[240px] items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:border-border-focus hover:text-text-secondary transition-all">
            <SearchIcon />
            <span className="flex-1 text-left">{isRu ? "Поиск…" : "Search…"}</span>
            <kbd className="rounded border border-border bg-canvas px-1.5 py-px font-mono text-[10px]">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setOpen(true)} aria-label="Search"
              className="md:hidden rounded p-1.5 text-text-muted hover:bg-surface hover:text-text-secondary transition-colors">
              <SearchIcon />
            </button>
            <LocaleSwitcher />
            <UserMenu />
          </div>
        </div>
      </header>

      <SearchModal locale={locale} open={open} onClose={() => setOpen(false)} />
    </>
  );
}