"use client";
import Link from "next/link";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";
import { categories } from "@/lib/tools-registry";
import { localizeCategories } from "@/lib/i18n/localize";
import { siteConfig } from "@/lib/seo";

export function Footer() {
  const { locale, dict } = useDict();
  const t = dict.footer;
  const localizedCats = localizeCategories(categories, locale);

  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href={localePath(locale, "/")} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
                <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-accent"/>
                <path d="M5 9h8M9 5v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent"/>
              </svg>
              <span className="text-sm font-semibold text-text-primary tracking-tight">Wrench-Branch</span>
            </Link>
            <p className="mt-3 text-xs text-text-muted leading-relaxed">{t.tagline}</p>
            <p className="mt-4 text-xs text-text-muted">
              © {new Date().getFullYear()} {siteConfig.name}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">{t.categoriesHeading}</h3>
            <ul className="space-y-2">
              {localizedCats.slice(0, 5).map((c) => (
                <li key={c.slug}>
                  <Link href={localePath(locale, `/categories/${c.slug}`)} className="text-xs text-text-muted hover:text-text-primary transition-colors">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">{t.productHeading}</h3>
            <ul className="space-y-2">
              <li><Link href={localePath(locale, "/tools")} className="text-xs text-text-muted hover:text-text-primary transition-colors">{t.allTools}</Link></li>
              <li><Link href={`${localePath(locale, "/")}#ai`} className="text-xs text-text-muted hover:text-text-primary transition-colors">{t.aiToolsComingSoon}</Link></li>
              <li><Link href={localePath(locale, "/docs")} className="text-xs text-text-muted hover:text-text-primary transition-colors">{t.documentation}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">{t.companyHeading}</h3>
            <ul className="space-y-2">
              <li><Link href={localePath(locale, "/privacy")} className="text-xs text-text-muted hover:text-text-primary transition-colors">{t.privacyPolicy}</Link></li>
              <li><Link href={localePath(locale, "/terms")} className="text-xs text-text-muted hover:text-text-primary transition-colors">{t.terms}</Link></li>
              <li><Link href={localePath(locale, "/contact")} className="text-xs text-text-muted hover:text-text-primary transition-colors">{t.contact}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <p className="text-xs text-text-muted">{t.copyrightNote}</p>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500/70" />
            {locale === "ru" ? "Работает в браузере" : "Runs in your browser"}
          </div>
        </div>
      </div>
    </footer>
  );
}
