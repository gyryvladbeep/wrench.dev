"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";
import { useAuth } from "@/lib/auth/auth-context";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { SearchModal } from "@/components/SearchModal";
import { WrenchScoreBadge } from "@/components/WrenchScoreBadge";
import { CategoryIcon } from "@/components/CategoryIcon";
import { applyAndSaveAccent } from "@/components/ThemeProvider";
import { categories } from "@/lib/tools-registry";
import { localizeCategories } from "@/lib/i18n/localize";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale } from "@/lib/i18n/config";

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

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden
    className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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

// ═══════════════════════════════════════════════════════
// Categories — было 3 отдельные ссылки в шапке (QA, API, Encoding) из
// 10 существующих категорий, остальные 7 были вообще недоступны из
// навигации. Заменили на один дропдаун сразу на все категории — это
// и решает "видно только 3 из 10", и освобождает место в шапке.
function CategoriesDropdown({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cats = localizeCategories(categories, locale);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-sm transition-colors duration-100 ${
          open ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
        }`}
      >
        {dict.nav.categories}
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="animate-scale-in absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-canvas p-1.5 shadow-2xl">
          {cats.map((cat) => (
            <Link
              key={cat.slug}
              href={localePath(locale, `/categories/${cat.slug}`)}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              <span className="text-text-muted opacity-70"><CategoryIcon category={cat.slug} size={14} /></span>
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { locale, dict } = useDict();
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Раньше здесь были две неудачные попытки починить гонку с защитным
  // редиректом /profile прямо тут — сначала через await/без await,
  // потом через "не переходить, если мы на /profile". Обе ненадёжны
  // или лишние. Настоящее решение теперь живёт в auth-context.tsx
  // (isSigningOut()) — /profile сама знает, что не надо мешать этому
  // переходу, пока идёт явный выход из аккаунта. Здесь ничего особого
  // знать не нужно — всегда ведём на главную, как и было задумано.
  function handleSignOut() {
    signOut();
    applyAndSaveAccent("#f59e0b");
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
      <WrenchScoreBadge />
      <Link href={localePath(locale, "/workbench")}
        title={locale === "ru" ? "Рабочий стол" : "Workbench"}
        className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface hover:text-text-primary transition-colors">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="2" y="2" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
          <rect x="8.5" y="2" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
          <rect x="2" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
          <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      </Link>
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

          {/* Logo — "Wrench" акцентом, "-Branch" тише рядом, чтобы не
              раздувать ширину логотипа, но при этом не терять полное
              название продукта, как было при просто "Wrench". */}
          <Link href={home} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <LOGO />
            <span className="text-sm font-semibold tracking-tight">
              <span className="text-text-primary">Wrench</span>
              <span className="text-text-muted">-Branch</span>
            </span>
          </Link>

          {/* Nav — сгруппировано, чтобы не разрастаться на каждую новую
              фичу: категории теперь один дропдаун вместо трёх ссылок. */}
          <nav className="hidden items-center gap-5 whitespace-nowrap lg:flex" aria-label="Main">
            <NavLink href={localePath(locale, "/tools")}>{dict.nav.tools}</NavLink>
            <CategoriesDropdown locale={locale} dict={dict} />
            <NavLink href={localePath(locale, "/workbench")}>
              <span className="flex items-center gap-1">
                {isRu ? "Рабочий стол" : "Workbench"}
                <span className="rounded bg-accent/20 px-1 py-px text-[9px] font-bold text-accent uppercase">New</span>
              </span>
            </NavLink>
            <NavLink href={localePath(locale, "/challenges")}>
              {isRu ? "Челленджи" : "Challenges"}
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

          {/* Search */}
          <button onClick={() => setOpen(true)}
            className="hidden md:flex flex-1 max-w-[200px] items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:border-border-focus hover:text-text-secondary transition-all">
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
