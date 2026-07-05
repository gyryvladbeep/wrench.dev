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
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">

          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <span className="font-mono text-accent">{`>_`}</span>
              Dev Toolbox
            </div>
            <p className="mt-2 text-sm text-text-muted">{t.tagline}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-primary">{t.categoriesHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              {localizedCategories.map((c) => (
                <li key={c.slug}>
                  <Link href={localePath(locale, `/categories/${c.slug}`)} className="hover:text-text-primary">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-primary">{t.productHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li>
                <Link href={localePath(locale, "/tools")} className="hover:text-text-primary">{t.allTools}</Link>
              </li>
              <li>
                <Link href={`${localePath(locale, "/")}#ai`} className="hover:text-text-primary">{t.aiToolsComingSoon}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-primary">{t.companyHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href={localePath(locale, "/docs")} className="hover:text-text-primary">{t.documentation}</Link></li>
              <li><Link href={localePath(locale, "/privacy")} className="hover:text-text-primary">{t.privacyPolicy}</Link></li>
              <li><Link href={localePath(locale, "/terms")} className="hover:text-text-primary">{t.terms}</Link></li>
              <li><Link href={localePath(locale, "/contact")} className="hover:text-text-primary">{t.contact}</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-xs text-text-muted">
          © {new Date().getFullYear()} {siteConfig.name}. {t.copyrightNote}
        </p>
      </div>
    </footer>
  );
}
