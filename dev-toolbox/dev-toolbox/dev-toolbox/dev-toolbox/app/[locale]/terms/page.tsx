import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale).pages.terms;
  return buildPageMetadata(locale, "/terms", t.heading, t.usingToolsBody.slice(0, 160));
}

export default function TermsPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale).pages.terms;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold md:text-3xl">{t.heading}</h1>
      <p className="mt-2 text-sm text-text-muted">{t.lastUpdated}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="text-base font-medium text-text-primary">{t.usingToolsHeading}</h2>
          <p className="mt-2">{t.usingToolsBody}</p>
        </section>
        <section>
          <h2 className="text-base font-medium text-text-primary">{t.acceptableUseHeading}</h2>
          <p className="mt-2">{t.acceptableUseBody}</p>
        </section>
        <section>
          <h2 className="text-base font-medium text-text-primary">{t.noWarrantyHeading}</h2>
          <p className="mt-2">{t.noWarrantyBody}</p>
        </section>
        <section>
          <h2 className="text-base font-medium text-text-primary">{t.changesHeading}</h2>
          <p className="mt-2">{t.changesBody}</p>
        </section>
      </div>
      <p className="mt-10 rounded-[10px] border border-dashed border-border bg-surface p-4 text-xs text-text-muted">
        {t.disclaimer}
      </p>
    </div>
  );
}
