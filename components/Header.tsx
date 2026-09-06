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

// Простая одноштриховая иконка гаечного ключа (в духе Lucide, как и
// остальные иконки в проекте — см. комментарий в CategoryIcon.tsx).
// Раньше тут был обобщённый квадрат с плюсом внутри, никак не
// связанный ни с названием продукта, ни с темой инструментов —
// выглядел как случайная заглушка, а не логотип.
const WrenchIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent"
    />
  </svg>
);

const LOGO = () => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-accent/15">
    <WrenchIcon size={15} />
  </span>
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

// Общий "выпадающий список ссылок" — и категории, и раздел обучения
// используют одну и ту же механику открытия/закрытия (клик снаружи,
// Esc), поэтому вынесено в один компонент вместо двух копий.
function NavDropdown({
  label, active, items,
}: {
  label: React.ReactNode;
  active: boolean;
  items: { key: string; href: string; icon?: React.ReactNode; label: string }[];
}) {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-sm transition-colors duration-100 ${
          open || active ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
        }`}
      >
        {label}
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="animate-scale-in absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-canvas p-1.5 shadow-2xl">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              {item.icon && <span className="text-text-muted opacity-70">{item.icon}</span>}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Почему категории и "Обучение" — дропдауны, а не отдельные ссылки
// ═══════════════════════════════════════════════════════
// Раньше в шапке было 8 отдельных пунктов (Tools, QA, API, Encoding,
// Challenges, Interview, Playground, Knowledge, Pro — и после
// добавления Workbench стало 9-10). На широких мониторах помещалось,
// но правый блок (бейдж уровня + иконки + email + выход) всё равно
// вылезал за пределы центрированного контейнера — реальный оверфлоу,
// измеренный на проде, а не просто "на глаз". Плюс из 10 категорий в
// шапке были видны только 3.
//
// Сгруппировали по смыслу: "Категории" — все 10 категорий инструментов,
// "Обучение" — Challenges/Interview/Playground/Knowledge (всё, что не
// про сам тулбокс, а про прокачку навыков). Итог — 5 пунктов верхнего
// уровня вместо 9, с полным доступом ко всему остальному через 2 клика.
function CategoriesDropdown({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname() ?? "";
  const cats = localizeCategories(categories, locale);
  return (
    <NavDropdown
      label={dict.nav.categories}
      active={pathname.includes("/categories/")}
      items={cats.map((cat) => ({
        key: cat.slug,
        href: localePath(locale, `/categories/${cat.slug}`),
        icon: <CategoryIcon category={cat.slug} size={14} />,
        label: cat.name,
      }))}
    />
  );
}

function LearnDropdown({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? "";
  const isRu = locale === "ru";
  const items = [
    { key: "challenges", href: localePath(locale, "/challenges"), label: isRu ? "Челленджи" : "Challenges" },
    { key: "interview",  href: localePath(locale, "/interview"),  label: isRu ? "Интервью" : "Interview" },
    { key: "playground", href: localePath(locale, "/playground"), label: "Playground" },
    { key: "knowledge",  href: localePath(locale, "/knowledge"),  label: isRu ? "База знаний" : "Knowledge" },
  ];
  const active = items.some((i) => pathname.startsWith(i.href));
  return (
    <NavDropdown label={isRu ? "Обучение" : "Learn"} active={active} items={items} />
  );
}

// Раньше справа в шапке стояли отдельно: бейдж уровня, иконка
// Workbench, кружок с инициалом и текстовая кнопка "Выйти" — четыре
// независимых элемента, из-за которых правый блок и не помещался.
// Workbench теперь и так есть в основной навигации, so иконку под него
// вынесли отсюда — весь аккаунт свернулся в один аватар с выпадающим
// меню, как в большинстве современных SaaS-продуктов.
function AvatarMenu() {
  const { locale, dict } = useDict();
  const { user, signOut } = useAuth();
  const router = useRouter();
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

  // Та же причина, что и раньше в handleSignOut в UserMenu — редирект
  // всегда на главную, гонку с защитным редиректом /profile решает
  // isSigningOut() в auth-context.tsx, а не порядок действий здесь.
  function handleSignOut() {
    signOut();
    applyAndSaveAccent("#f59e0b");
    setOpen(false);
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title={user.email ?? ""}
        aria-label="Account menu"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
      >
        {(user.email ?? "?")[0].toUpperCase()}
      </button>
      {open && (
        <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-canvas p-1.5 shadow-2xl">
          <div className="border-b border-border px-2.5 pb-2.5 pt-1.5">
            <p className="truncate text-xs text-text-muted">{user.email}</p>
            <div className="mt-1.5"><WrenchScoreBadge /></div>
          </div>
          <Link href={localePath(locale, "/profile")} onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-2.5 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary">
            {dict.auth.profile}
          </Link>
          <button onClick={handleSignOut}
            className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface hover:text-red-400">
            {dict.auth.signOut}
          </button>
        </div>
      )}
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
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-5 px-5">

          {/* Logo */}
          <Link href={home} className="flex shrink-0 items-center gap-2 hover:opacity-80 transition-opacity">
            <LOGO />
            <span className="text-sm font-semibold tracking-tight">
              <span className="text-text-primary">Wrench</span>
              <span className="text-text-muted">-Branch</span>
            </span>
          </Link>

          {/* Nav — 5 пунктов верхнего уровня вместо прежних 9-10, см.
              комментарий у CategoriesDropdown про то, почему. */}
          <nav className="hidden items-center gap-5 whitespace-nowrap lg:flex" aria-label="Main">
            <NavLink href={localePath(locale, "/tools")}>{dict.nav.tools}</NavLink>
            <CategoriesDropdown locale={locale} dict={dict} />
            <NavLink href={localePath(locale, "/workbench")}>
              <span className="flex items-center gap-1">
                {isRu ? "Рабочий стол" : "Workbench"}
                <span className="rounded bg-accent/20 px-1 py-px text-[9px] font-bold text-accent uppercase">New</span>
              </span>
            </NavLink>
            <LearnDropdown locale={locale} />
            <NavLink href={localePath(locale, "/pro")}>
              <span className="flex items-center gap-1">
                Pro
                <span className="rounded bg-violet-500/20 px-1 py-px text-[9px] font-bold text-violet-400 uppercase">$5</span>
              </span>
            </NavLink>
          </nav>

          {/* Правая группа — поиск, локаль и аккаунт держатся вместе одним
              блоком, прижатым к правому краю через ml-auto. Раньше поиск
              стоял отдельно с flex-1 (рос, пока не упрётся в max-width),
              и после того как навигация слева стала компактнее (5 пунктов
              вместо 9), свободного места стало больше, а забирал его как
              раз этот flex-1 — получался пустой зазор ИМЕННО перед этой
              группой, а не растяжение чего-то полезного. Сгруппировав всё
              вместе, лишнее пространство уходит в единственный, ожидаемый
              промежуток между навигацией и правым блоком, а не повисает
              необъяснимой дырой посреди шапки. */}
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setOpen(true)}
              className="hidden md:flex w-44 items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:border-border-focus hover:text-text-secondary transition-all">
              <SearchIcon />
              <span className="flex-1 text-left">{isRu ? "Поиск…" : "Search…"}</span>
              <kbd className="rounded border border-border bg-canvas px-1.5 py-px font-mono text-[10px]">⌘K</kbd>
            </button>
            <button onClick={() => setOpen(true)} aria-label="Search"
              className="md:hidden rounded p-1.5 text-text-muted hover:bg-surface hover:text-text-secondary transition-colors">
              <SearchIcon />
            </button>
            <LocaleSwitcher />
            <AvatarMenu />
          </div>
        </div>
      </header>

      <SearchModal locale={locale} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
