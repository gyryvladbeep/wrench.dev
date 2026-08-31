import Link from "next/link";
import { Locale, localePath } from "@/lib/i18n/config";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const LOGO = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
    <rect x="1.5" y="1.5" width="17" height="17" rx="3.5" stroke="currentColor" strokeWidth="1.5" className="text-accent"/>
    <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="text-accent"/>
  </svg>
);

interface FooterProps { dict: Dictionary; locale: Locale; }

export function Footer({ dict, locale }: FooterProps) {
  const isRu = locale === "ru";

  const LINKS = {
    [isRu ? "Инструменты" : "Tools"]: [
      { label: isRu ? "Все инструменты" : "All Tools",    href: "/tools" },
      { label: isRu ? "Форматирование"  : "Formatting",   href: "/categories/formatting" },
      { label: isRu ? "Кодирование"     : "Encoding",     href: "/categories/encoding" },
      { label: isRu ? "QA"              : "QA",            href: "/categories/qa" },
      { label: isRu ? "Генераторы"      : "Generators",   href: "/categories/generators" },
    ],
    [isRu ? "Платформа" : "Platform"]: [
      { label: isRu ? "Челленджи"       : "Challenges",   href: "/challenges" },
      { label: isRu ? "Интервью"        : "Interview",    href: "/interview" },
      { label: "Playground",                               href: "/playground" },
      { label: isRu ? "База знаний"     : "Knowledge",    href: "/knowledge" },
    ],
    [isRu ? "Компания" : "Company"]: [
      { label: isRu ? "Pro план"        : "Pro Plan",     href: "/pro" },
      { label: isRu ? "Конфиденциальность" : "Privacy",  href: "/privacy" },
      { label: isRu ? "Условия"         : "Terms",        href: "/terms" },
      { label: isRu ? "Контакты"        : "Contact",      href: "/contact" },
    ],
  };

  return (
    <footer className="border-t border-border bg-canvas">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <Link href={localePath(locale, "/")} className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity w-fit">
              <LOGO />
              <span className="text-sm font-bold text-text-primary">Wrench-Branch</span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed max-w-[220px]">
              {isRu
                ? "Незаменимые инструменты для разработчиков, QA-инженеров и DevOps."
                : "Essential tools for developers, QA engineers and DevOps."}
            </p>

            {/* Stats */}
            <div className="mt-4 flex gap-4">
              {[
                { value: "70+", label: isRu ? "инструментов" : "tools" },
                { value: "56",  label: isRu ? "задач" : "challenges" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-sm font-bold text-accent">{s.value}</p>
                  <p className="text-[10px] text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{title}</p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={localePath(locale, href)}
                      className="text-xs text-text-muted hover:text-text-primary transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-[11px] text-text-muted">
            © {new Date().getFullYear()} Wrench-Branch.
            {isRu ? " Все инструменты работают в браузере — данные никуда не отправляются." : " All tools run in your browser — your data is never uploaded."}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] text-text-muted">{isRu ? "Работает в браузере" : "Runs in your browser"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}