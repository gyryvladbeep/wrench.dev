import { Metadata } from "next";
import Link from "next/link";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale).pages.privacy;
  return buildPageMetadata(locale, "/privacy", t.heading, t.shortVersionBody.slice(0, 160));
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale).pages.privacy;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold md:text-3xl">{t.heading}</h1>
      <p className="mt-2 text-sm text-text-muted">{t.lastUpdated}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="text-base font-medium text-text-primary">{t.shortVersionHeading}</h2>
          <p className="mt-2">{t.shortVersionBody}</p>
        </section>
        <section>
          <h2 className="text-base font-medium text-text-primary">{t.analyticsHeading}</h2>
          <p className="mt-2">{t.analyticsBody}</p>
        </section>
        <section>
          <h2 className="text-base font-medium text-text-primary">{t.accountsHeading}</h2>
          <p className="mt-2">{t.accountsBody}</p>
        </section>
        <section>
          <h2 className="text-base font-medium text-text-primary">{t.contactHeading}</h2>
          <p className="mt-2">
            {t.contactBodyPrefix}{" "}
            <Link href={localePath(locale, "/contact")} className="text-link hover:underline">
              {t.contactLinkText}
            </Link>.
          </p>
        </section>
      </div>
      <p className="mt-10 rounded-[10px] border border-dashed border-border bg-surface p-4 text-xs text-text-muted">
        {t.disclaimer}
      </p>
    </div>
  );
}
