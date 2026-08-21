import Link from "next/link";
import { Metadata } from "next";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { categories, getToolsByCategory } from "@/lib/tools-registry";
import { localizeCategories } from "@/lib/i18n/localize";
import { formatToolCount } from "@/lib/i18n/format";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.pages.docs;
  return buildPageMetadata(locale, "/docs", t.heading, t.intro);
}

export default function DocsPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.pages.docs;
  const localizedCategories = localizeCategories(categories, locale);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold md:text-3xl">{t.heading}</h1>
      <p className="mt-4 text-text-muted">{t.intro}</p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t.toolsByCategoryHeading}</h2>
        <div className="mt-3 space-y-2 text-sm">
          {localizedCategories.map((c) => (
            <div key={c.slug}>
              <Link href={localePath(locale, `/categories/${c.slug}`)} className="text-link hover:underline">
                {c.name}
              </Link>
              <span className="text-text-muted">
                {" — "}{formatToolCount(getToolsByCategory(c.slug).length, locale)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t.howItWorksHeading}</h2>
        <p className="mt-2 text-sm text-text-muted">{t.howItWorksBody}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t.apiHeading}</h2>
        <p className="mt-2 text-sm text-text-muted">{t.apiBody}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t.aiHeading}</h2>
        <p className="mt-2 text-sm text-text-muted">
          {t.aiBodyPrefix}{" "}
          <Link href={`${localePath(locale, "/")}#ai`} className="text-link hover:underline">
            {t.aiBodyLinkText}
          </Link>{" "}
          {t.aiBodySuffix}
        </p>
      </section>
    </div>
  );
}
