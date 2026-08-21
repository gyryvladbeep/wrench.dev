import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale).pages.contact;
  return buildPageMetadata(locale, "/contact", t.heading, t.requestsBody.slice(0, 160));
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale).pages.contact;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold md:text-3xl">{t.heading}</h1>
      <p className="mt-4 text-sm leading-relaxed text-text-muted">
        {t.bodyPrefix}{" "}
        <a href="mailto:hello@devtoolbox.example.com" className="text-link hover:underline">
          hello@devtoolbox.example.com
        </a>{" "}
        {t.bodySuffix}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-text-muted">{t.requestsBody}</p>
    </div>
  );
}
