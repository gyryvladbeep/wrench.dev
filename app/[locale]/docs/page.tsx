import Link from "next/link";
import { Metadata } from "next";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata, siteConfig } from "@/lib/seo";
import { categories, getToolsByCategory } from "@/lib/tools-registry";
import { localizeCategories } from "@/lib/i18n/localize";
import { formatToolCount } from "@/lib/i18n/format";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.pages.docs;
  return buildPageMetadata(locale, "/docs", t.heading, t.intro);
}

export default async function DocsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
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

      <section id="api" className="mt-8">
        <h2 className="text-lg font-medium">{t.apiHeading}</h2>
        <p className="mt-2 text-sm text-text-muted">{t.apiBody}</p>
        <pre className="code-surface mt-3 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed text-text-secondary">
          curl {siteConfig.url}/api/v1/tools/json-formatter
        </pre>
        {/* Обычные <a>, не <Link> — оба ведут на JSON-ответ роут-хендлера
            (app/api/v1/...), а не на страницу приложения: Link здесь
            добавил бы клиентский префетч/навигацию туда, где смысл —
            просто открыть/скачать файл, обычная браузерная переходность
            подходит лучше. */}
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <a href="/api/v1/openapi.json" className="text-link hover:underline">{t.apiOpenApiLinkText} →</a>
          <a href="/api/v1/postman-collection.json" className="text-link hover:underline">{t.apiPostmanLinkText} →</a>
        </div>
        <p className="mt-3 text-sm text-text-muted">{t.apiFutureNote}</p>

        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-text-primary">{t.apiWriteHeading}</h3>
          <p className="mt-2 text-sm text-text-muted">{t.apiWriteBody}</p>
          <pre className="code-surface mt-3 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed text-text-secondary">
            {`curl -X POST ${siteConfig.url}/api/v1/mock-endpoints \\\n  -H "Authorization: Bearer wrb_..." -H "Content-Type: application/json" \\\n  -d '{"name":"CI mock","routes":[{"method":"GET","path":"/ping","status_code":200}]}'`}
          </pre>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link href={localePath(locale, "/profile")} className="text-link hover:underline">{t.apiWriteTokenLinkText} →</Link>
            <a
              href="https://github.com/gyryvladbeep/wrench.dev/tree/main/.github/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:underline"
            >
              {t.apiWriteActionsLinkText} →
            </a>
          </div>
        </div>
      </section>

      {/* CLI + VS Code-расширение (roadmap items 8/9) — раньше оба
          реально существовали в репозитории (cli/, vscode-extension/),
          CLI даже опубликован на npm, но на самом сайте про них не было
          ни слова — узнать о них можно было только заглянув в код.
          Секция сразу после API — тот же принцип, тот же стиль
          подраздела, что apiWriteHeading внутри apiHeading выше. */}
      <section id="cli" className="mt-8">
        <h2 className="text-lg font-medium">{t.cliHeading}</h2>
        <p className="mt-2 text-sm text-text-muted">{t.cliBody}</p>
        <pre className="code-surface mt-3 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed text-text-secondary">
          {`npx wrench-branch json format '{"a":1,"b":2}'\n\nnpm install -g wrench-branch\nwrench uuid\nwrench hash sha256 "hello"\nwrench tools list`}
        </pre>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <a href="https://www.npmjs.com/package/wrench-branch" target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
            {t.cliNpmLinkText} →
          </a>
          <a href="https://github.com/gyryvladbeep/wrench.dev/tree/main/cli" target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
            {t.cliReadmeLinkText} →
          </a>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-text-primary">{t.vscodeSubheading}</h3>
          <p className="mt-2 text-sm text-text-muted">{t.vscodeBody}</p>
          <pre className="code-surface mt-3 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed text-text-secondary">
            {`git clone https://github.com/gyryvladbeep/wrench.dev.git\ncd wrench.dev/vscode-extension\nnpm install && npm run compile\nnpx vsce package`}
          </pre>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <a href="https://github.com/gyryvladbeep/wrench.dev/tree/main/vscode-extension" target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
              {t.vscodeReadmeLinkText} →
            </a>
          </div>
        </div>
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
