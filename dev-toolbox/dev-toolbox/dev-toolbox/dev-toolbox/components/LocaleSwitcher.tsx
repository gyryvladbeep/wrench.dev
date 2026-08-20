"use client";

import { usePathname } from "next/navigation";
import { useDict } from "@/lib/i18n/dict-context";

const COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Sets the NEXT_LOCALE cookie before navigating so the middleware
 * respects the explicit user choice instead of reading Accept-Language.
 *
 * Uses window.location.href (full page reload) intentionally — a language
 * switch must reload the page so Next.js serves the correct locale bundle.
 * The middleware reads the cookie on the very next request, so the redirect
 * loop is broken.
 */
function switchLocale(targetLocale: string, href: string) {
  document.cookie = `${COOKIE_NAME}=${targetLocale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  window.location.href = href;
}

export function LocaleSwitcher() {
  const { locale } = useDict();
  const pathname = usePathname() ?? "/";

  // Strip /ru prefix to get the locale-neutral path
  const withoutLocale = pathname.startsWith("/ru")
    ? pathname.slice(3) || "/"
    : pathname;

  const enHref = withoutLocale || "/";
  const ruHref = `/ru${withoutLocale === "/" ? "" : withoutLocale}`;

  return (
    <div className="flex items-center gap-1 text-xs font-medium" aria-label="Language">
      <button
        onClick={() => locale !== "en" && switchLocale("en", enHref)}
        aria-current={locale === "en" ? "true" : undefined}
        aria-label="Switch to English"
        className={`rounded px-1.5 py-0.5 transition-colors ${
          locale === "en"
            ? "bg-surface text-text-primary ring-1 ring-border cursor-default"
            : "text-text-muted hover:text-text-primary cursor-pointer"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => locale !== "ru" && switchLocale("ru", ruHref)}
        aria-current={locale === "ru" ? "true" : undefined}
        aria-label="Switch to Russian"
        className={`rounded px-1.5 py-0.5 transition-colors ${
          locale === "ru"
            ? "bg-surface text-text-primary ring-1 ring-border cursor-default"
            : "text-text-muted hover:text-text-primary cursor-pointer"
        }`}
      >
        RU
      </button>
    </div>
  );
}
