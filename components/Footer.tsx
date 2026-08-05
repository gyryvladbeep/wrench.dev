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
  const localizedCategories = localizeCategories(categories, locale);

  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={localePath(locale, "/")} className="flex items-center gap-2 font-semibold text-text-primary hover:opacity-80 transition-opacity">
              <span className="font-mono text-accent">{`>_`}</span>
              Wrench
            </Link>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">{t.tagline}</p>
            <p className="mt-3 text-xs text-text-muted">
              © {new Date().getFullYear()} {siteConfig.name}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{t.categoriesHeading}</h3>
            <ul className="space-y-2">
              {localizedCategories.slice(0, 5).map((c) => (
                <li key={c.slug}>
                  <Link href={localePath(locale, `/categories/${c.slug}`)}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{t.productHeading}</h3>
            <ul className="space-y-2">
              <li><Link href={localePath(locale, "/tools")} className="text-sm text-text-muted hover:text-text-primary transition-colors">{t.allTools}</Link></li>
              <li><Link href={`${localePath(locale, "/")}#ai`} className="text-sm text-text-muted hover:text-text-primary transition-colors">{t.aiToolsComingSoon}</Link></li>
              <li><Link href={localePath(locale, "/docs")} className="text-sm text-text-muted hover:text-text-primary transition-colors">{t.documentation}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{t.companyHeading}</h3>
            <ul className="space-y-2">
              <li><Link href={localePath(locale, "/privacy")} className="text-sm text-text-muted hover:text-text-primary transition-colors">{t.privacyPolicy}</Link></li>
              <li><Link href={localePath(locale, "/terms")} className="text-sm text-text-muted hover:text-text-primary transition-colors">{t.terms}</Link></li>
              <li><Link href={localePath(locale, "/contact")} className="text-sm text-text-muted hover:text-text-primary transition-colors">{t.contact}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-text-muted">{t.copyrightNote}</p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              {locale === "ru" ? "Всё работает в браузере" : "All tools run in-browser"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
