"use client";

import { usePathname, useRouter } from "next/navigation";
import { useDict } from "@/lib/i18n/dict-context";

const COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LocaleSwitcher() {
  const { locale } = useDict();
  const pathname   = usePathname() ?? "/";
  const router     = useRouter();

  const withoutLocale = pathname.startsWith("/ru")
    ? pathname.slice(3) || "/"
    : pathname;

  const enHref = withoutLocale || "/";
  const ruHref = `/ru${withoutLocale === "/" ? "" : withoutLocale}`;

  function switchLocale(targetLocale: string, href: string) {
    // Set cookie so middleware knows preferred locale on NEXT request
    document.cookie = `${COOKIE_NAME}=${targetLocale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
    // Client-side navigation — does NOT reset Supabase session
    router.push(href);
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium" aria-label="Language">
      <button
        onClick={() => locale !== "en" && switchLocale("en", enHref)}
        className={`rounded px-1.5 py-0.5 transition-colors ${
          locale === "en"
            ? "bg-surface text-text-primary ring-1 ring-border cursor-default"
            : "text-text-muted hover:text-text-primary cursor-pointer"
        }`}
      >EN</button>
      <button
        onClick={() => locale !== "ru" && switchLocale("ru", ruHref)}
        className={`rounded px-1.5 py-0.5 transition-colors ${
          locale === "ru"
            ? "bg-surface text-text-primary ring-1 ring-border cursor-default"
            : "text-text-muted hover:text-text-primary cursor-pointer"
        }`}
      >RU</button>
    </div>
  );
}